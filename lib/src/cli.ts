#!/usr/bin/env node

import { decompressSliceInBundle } from './bundles/bundle'
import { getFileInfo, readIndexBundle } from './bundles/index-bundle'
import { Header, getHeaderLength } from './dat/header'
import { DatFile, readDatFile } from './dat/dat-file'
import { readColumn } from './dat/reader'
import { SCHEMA_URL, SCHEMA_VERSION, SchemaFile } from 'pathofexile-dat-schema'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as v8 from 'v8'

v8.setFlagsFromString('--experimental-wasm-simd')

interface ExportConfig {
  patch: string
  files: string[]
  tables: Array<{
    name: string
    columns: string[]
  }>
}

let PATCH_VER: string
let CACHE_DIR: string
let INDEX: {
  bundlesInfo: Uint8Array
  filesInfo: Uint8Array
  dirsInfo: Uint8Array
  pathReps: Uint8Array
}
const BUNDLE_DIR = 'Bundles2'
const TRANSLATIONS = [
  { name: 'English', path: 'Data' },
  { name: 'French', path: 'Data/French' },
  { name: 'German', path: 'Data/German' },
  { name: 'Korean', path: 'Data/Korean' },
  { name: 'Portuguese', path: 'Data/Portuguese' },
  { name: 'Russian', path: 'Data/Russian' },
  { name: 'Spanish', path: 'Data/Spanish' },
  { name: 'Thai', path: 'Data/Thai' }
]

let schema: SchemaFile

;(async function main () {
  const config = require(path.join(process.cwd(), '/config.json')) as ExportConfig
  PATCH_VER = config.patch
  console.log(`Loaded config.json, patch version is '${PATCH_VER}'`)

  CACHE_DIR = path.join(process.cwd(), '/.cache', PATCH_VER)
  if (!fs.existsSync(CACHE_DIR)) {
    console.log('Creating new bundle cache...')
    fs.rmSync(path.join(process.cwd(), '/.cache'), { recursive: true, force: true })
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }

  await loadIndex()

  console.log('Loading schema for dat files')
  schema = await fetchSchema()
  if (schema.version !== SCHEMA_VERSION) {
    console.error('Schema has format not compatible with this package. Check for "pathofexile-dat" updates.')
    process.exit(1)
  }

  fs.rmSync(path.join(process.cwd(), 'files'), { recursive: true, force: true })
  fs.mkdirSync(path.join(process.cwd(), 'files'))
  for (const filePath of config.files) {
    const name = path.basename(filePath)
    fs.writeFileSync(
      path.join(process.cwd(), 'files', name),
      await getFileContent(filePath)
    )
  }

  for (const tr of TRANSLATIONS) {
    fs.rmSync(path.join(process.cwd(), 'tables', tr.name), { recursive: true, force: true })
    fs.mkdirSync(path.join(process.cwd(), 'tables', tr.name), { recursive: true })
  }
  for (const target of config.tables) {
    for (const tr of TRANSLATIONS) {
      const datFile = await getDatFile(`${tr.path}/${target.name}.dat64`)
      const headers = importHeaders(target.name, datFile)
        .filter(hdr => target.columns.includes(hdr.name))

      for (const column of target.columns) {
        if (!headers.some(hdr => hdr.name === column)) {
          console.error(`Table "${target.name}" doesn't have a column named "${column}".`)
          process.exit(1)
        }
      }

      fs.writeFileSync(
        path.join(process.cwd(), 'tables', tr.name, `${target.name}.json`),
        JSON.stringify(exportAllRows(headers, datFile), null, 2)
      )
    }
  }
})()

export function exportAllRows (headers: NamedHeader[], datFile: DatFile) {
  const columns = headers
    .map(header => ({
      name: header.name,
      data: readColumn(header, datFile)
    }))

  columns.unshift({
    name: '_index',
    data: Array(datFile.rowCount).fill(undefined)
      .map((_, idx) => idx)
  })

  return Array(datFile.rowCount).fill(undefined)
    .map((_, idx) => Object.fromEntries(
      columns.map(col => [col.name, col.data[idx]])
    ))
}

async function loadIndex () {
  console.log('Loading bundles index...')

  const indexBin = await fetchFile('_.index.bin')
  const indexBundle = await decompressSliceInBundle(new Uint8Array(indexBin))
  const _index = readIndexBundle(indexBundle)
  INDEX = {
    bundlesInfo: _index.bundlesInfo,
    filesInfo: _index.filesInfo,
    dirsInfo: _index.dirsInfo,
    pathReps: await decompressSliceInBundle(_index.pathRepsBundle)
  }
}

async function getDatFile (fullPath: string) {
  console.log(`Reading '${fullPath}' ...`)

  const location = getFileInfo(fullPath, INDEX.bundlesInfo, INDEX.filesInfo)
  const bundleBin = await fetchFile(location.bundle)
  return readDatFile(
    fullPath,
    await decompressSliceInBundle(new Uint8Array(bundleBin), location.offset, location.size)
  )
}

async function getFileContent (fullPath: string) {
  console.log(`Saving '${fullPath}' ...`)

  const location = getFileInfo(fullPath, INDEX.bundlesInfo, INDEX.filesInfo)
  const bundleBin = await fetchFile(location.bundle)
  return decompressSliceInBundle(new Uint8Array(bundleBin), location.offset, location.size)
}

async function fetchFile (name: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const cachedFilePath = path.join(CACHE_DIR, name.replace(/\//g, '_'))
    if (fs.existsSync(cachedFilePath)) {
      resolve(fs.readFileSync(cachedFilePath))
      return
    }

    console.log(`Loading from CDN: ${name} ...`)

    const out = fs.createWriteStream(cachedFilePath)
    const webpath = `${PATCH_VER}/${BUNDLE_DIR}/${name}`
    const request = https.get(`https://poe-bundles.snos.workers.dev/${webpath}`, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(cachedFilePath, () => { reject(response) })
      } else {
        response.pipe(out)
      }
    })
    request.on('error', (err) => {
      fs.unlink(cachedFilePath, () => { reject(err) })
    })
    out.on('error', (err) => {
      fs.unlink(cachedFilePath, () => { reject(err) })
    })
    out.on('finish', () => {
      out.close()
      resolve(fs.readFileSync(cachedFilePath))
    })
  })
}

async function fetchSchema (): Promise<SchemaFile> {
  return new Promise((resolve, reject) => {
    (function followUrl (url: string) {
      const request = https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          return followUrl(response.headers.location!)
        }
        let data = ''
        response.on('data', chunk => { data += chunk })
        response.on('end', () => { resolve(JSON.parse(data)) })
      })
      request.on('error', (err) => { reject(err) })
    })(SCHEMA_URL)
  })
}

interface NamedHeader extends Header {
  name: string
}

function importHeaders (name: string, datFile: DatFile): NamedHeader[] {
  const headers = [] as NamedHeader[]

  const sch = schema.tables.find(s => s.name === name)!
  let offset = 0
  for (const column of sch.columns) {
    headers.push({
      name: column.name || '',
      offset,
      type: {
        array: column.array,
        integer:
          // column.type === 'u8' ? { unsigned: true, size: 1 }
          // : column.type === 'u16' ? { unsigned: true, size: 2 }
          // : column.type === 'u32' ? { unsigned: true, size: 4 }
          // : column.type === 'u64' ? { unsigned: true, size: 8 }
          // : column.type === 'i8' ? { unsigned: false, size: 1 }
          // : column.type === 'i16' ? { unsigned: false, size: 2 }
          column.type === 'i32' ? { unsigned: false, size: 4 }
          // : column.type === 'i64' ? { unsigned: false, size: 8 }
          : column.type === 'enumrow' ? { unsigned: false, size: 4 }
          : undefined,
        decimal:
          column.type === 'f32' ? { size: 4 }
          // : column.type === 'f64' ? { size: 8 }
          : undefined,
        string:
          column.type === 'string' ? {}
          : undefined,
        boolean:
          column.type === 'bool' ? {}
          : undefined,
        key:
          (column.type === 'row' || column.type === 'foreignrow') ? {
            foreign: (column.type === 'foreignrow')
          }
          : undefined
      }
    })
    offset += getHeaderLength(headers[headers.length - 1], datFile)
  }
  return headers
}
