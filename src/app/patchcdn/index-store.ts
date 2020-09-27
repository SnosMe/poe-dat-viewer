import { decompressBundle, decompressFileTransferBundle } from '../worker/interface'
import { readFilesIndex, getFileLocation } from './bundle-index'
import { fetchFile } from './cache'
import Vue from 'vue'
import FileSaver from 'file-saver'
import { importFromFile as importDat } from '../dat/dat-file'
import { app } from '../viewer/Viewer'

let index_ = null as {
  bundle: Uint8Array
  filesOffset: number
  dirs: Map<string, string[]>
} | null

export const ContentTree = Vue.observable({
  tree: [] as Readonly<
    Array<{ label: string, isFile: boolean }>
  >,
  current: ''
})

function initRoots () {
  const firstLvl = [] as string[]
  for (const dirName of index_!.dirs.keys()) {
    if (!dirName.includes('/')) {
      firstLvl.push(dirName)
    }
  }

  ContentTree.tree = firstLvl.map(dirName => ({
    label: dirName,
    isFile: false
  })).sort((a, b) => a.label.localeCompare(b.label))
  ContentTree.current = ''
}

export function listDirContent (fullPath: string) {
  if (fullPath === '') {
    initRoots()
    return
  }

  const files = index_!.dirs.get(fullPath)!

  const childDirs = [] as string[]
  for (const dirName of index_!.dirs.keys()) {
    if (
      dirName.startsWith(fullPath) &&
      dirName.lastIndexOf('/') === fullPath.length
    ) {
      childDirs.push(dirName.substring(dirName.lastIndexOf('/') + 1))
    }
  }

  ContentTree.tree = Object.freeze([
    {
      label: '../',
      isFile: false
    },
    ...childDirs.map(dirName => ({
      label: dirName,
      isFile: false
    })).sort((a, b) => a.label.localeCompare(b.label)),
    ...files.map(fileName => ({
      label: fileName,
      isFile: true
    })).sort((a, b) => a.label.localeCompare(b.label))
  ])

  ContentTree.current = fullPath
}

export async function loadFile (fullPath: string) {
  const fileContent = await loadFileContent(fullPath)

  if (fullPath.endsWith('.dat') || fullPath.endsWith('.dat64')) {
    const datFile = await importDat(fullPath, fileContent)
    await app.viewers[0].instance.loadDat(datFile)
    return
  }

  FileSaver.saveAs(new File(
    [fileContent],
    fullPath.substring(fullPath.lastIndexOf('/') + 1),
    { type: 'application/octet-stream' }
  ))
}

export async function loadFileContent (fullPath: string) {
  const location = getFileLocation(index_!.bundle, fullPath, index_!.filesOffset)
  const bundleBin = await fetchFile(null, location.bundle)

  return await decompressFileTransferBundle(bundleBin, location.offset, location.size)
}

export async function loadIndex (indexBin: ArrayBuffer) {
  const indexBundle = await decompressBundle(new Uint8Array(indexBin))
  const index = await readFilesIndex(indexBundle)
  index_ = {
    bundle: indexBundle,
    ...index
  }
  initRoots()
}
