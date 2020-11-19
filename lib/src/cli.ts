#!/usr/bin/env node

import { schema, SchemaTable } from './dat/schema'
import { decompressSliceInBundle } from './bundles/bundle'
import { getFileInfo, readIndexBundle } from './bundles/index-bundle'
import { Header, getHeaderLength } from './dat/header'
import { DatFile, readDatFile } from './dat/dat-file'
import { readColumn } from './dat/reader'
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
      fs.writeFileSync(
        path.join(process.cwd(), 'tables', tr.name, `${target.name}.json`),
        JSON.stringify(exportAllRows(headers, datFile), null, 2)
      )
    }
  }
})()

export function exportAllRows (headers: ExtendedHeader[], datFile: DatFile) {
  const columns = headers
    .map(header => ({
      name: header.name,
      data: (() => {
        const data = readColumn(header, datFile)

        if (header.type.key?.foreign) {
          if (!header.type.array) {
            const data_ = data as ({ rid: number, unknown: number } | null)[]
            if (!data_.every(row => row == null || row.unknown === 0)) {
              throw new Error('never')
            }
            return data_.map(row => row && row.rid)
          } else {
            const data_ = data as (Array<{ rid: number, unknown: number }>)[]
            if (!data_.every(row => row.every(entry => entry.unknown === 0))) {
              throw new Error('never')
            }
            return data_.map(row => row.map(entry => entry.rid))
          }
        }

        return data
      })()
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

interface ExtendedHeader extends Header { 
  name: string
}

function importHeaders (name: string, datFile: DatFile) {
  const headers = [] as ExtendedHeader[]
  
  const sch = schema.find(s => s.name === name) as SchemaTable
  let offset = 0
  for (const column of sch.columns) {
    headers.push({
      name: column.name,
      offset,
      type: {
        array: column.array,
        integer:
          column.type === 'uint8' ? { unsigned: true, size: 1 }
          : column.type === 'uint16' ? { unsigned: true, size: 2 }
          : column.type === 'uint32' ? { unsigned: true, size: 4 }
          : column.type === 'uint64' ? { unsigned: true, size: 8 }
          : column.type === 'int8' ? { unsigned: false, size: 1 }
          : column.type === 'int16' ? { unsigned: false, size: 2 }
          : column.type === 'int32' ? { unsigned: false, size: 4 }
          : column.type === 'int64' ? { unsigned: false, size: 8 }
          : column.type === 'enum0' || column.type === 'enum1' ? { unsigned: true, size: 4 }
          : undefined,
        decimal:
          column.type === 'float32' ? { size: 4 }
          : column.type === 'float64' ? { size: 8 }
          : undefined,
        string:
          column.type === 'string' ? {}
          : undefined,
        boolean:
          column.type === 'bool' ? {}
          : undefined,
        key:
          column.type === 'rowidx' ? {
            foreign: column.references ? (column.references as { table: string }).table !== name : false
          }
          : undefined
      }
    })
    offset += getHeaderLength(headers[headers.length - 1], datFile)
  }
  return headers
}
