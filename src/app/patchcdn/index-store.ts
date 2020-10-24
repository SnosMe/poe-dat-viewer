import { decompressBundle, decompressFileTransferBundle } from '../worker/interface'
import { readIndexBundle, getFileInfo } from '../bundles/index-bundle'
import { getDirContent, getRootDirs } from '../bundles/index-paths'
import { fetchFile } from './cache'
import Vue from 'vue'
import FileSaver from 'file-saver'
import { importFromFile as importDat } from '../dat/dat-file'
import { app } from '../viewer/Viewer'

let index_ = null as {
  bundlesInfo: Uint8Array,
  filesInfo: Uint8Array,
  dirsInfo: Uint8Array,
  pathReps: Uint8Array
} | null

export const ContentTree = Vue.observable({
  tree: [] as Readonly<
    Array<{ label: string, isFile: boolean }>
  >,
  current: ''
})

function initRoots () {
  const roots = getRootDirs(index_!.pathReps, index_!.dirsInfo)

  ContentTree.tree = roots.map(dirName => ({
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

  const content = getDirContent(fullPath, index_!.pathReps, index_!.dirsInfo)
  content.dirs = content.dirs.map(s => s.substr(fullPath.length + 1))
  content.files = content.files.map(s => s.substr(fullPath.length + 1))

  if (fullPath === 'Data') {
    content.files = content.files.filter(file => file === 'Mods.dat64' || file === 'AbyssObjects.dat64')
  }

  ContentTree.tree = Object.freeze([
    {
      label: '../',
      isFile: false
    },
    ...content.dirs.map(dirName => ({
      label: dirName,
      isFile: false
    })).sort((a, b) => a.label.localeCompare(b.label)),
    ...content.files.map(fileName => ({
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
  const location = getFileInfo(fullPath, index_!.bundlesInfo, index_!.filesInfo)
  const bundleBin = await fetchFile(null, location.bundle)

  return await decompressFileTransferBundle(bundleBin, location.offset, location.size)
}

export async function loadIndex (indexBin: ArrayBuffer) {
  const indexBundle = await decompressBundle(new Uint8Array(indexBin))
  const index = readIndexBundle(indexBundle)
  index_ = {
    bundlesInfo: index.bundlesInfo,
    filesInfo: index.filesInfo,
    dirsInfo: index.dirsInfo,
    pathReps: await decompressBundle(index.pathRepsBundle)
  }
  initRoots()
}
