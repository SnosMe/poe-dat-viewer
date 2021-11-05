import { shallowRef, shallowReactive, Ref } from 'vue'
import { readDatFile } from 'pathofexile-dat'
import { getDirContent, getFileInfo, readIndexBundle } from 'pathofexile-dat/bundles'
import { decompressBundle, decompressFileInBundle, getBatchFileInfo, analyzeDatFile } from '../worker/interface'
import type { BundleLoader } from './cache'
import { findByName } from '../dat-viewer/db'
import { fromSerializedHeaders } from '@/app/dat-viewer/headers'

export const index = shallowRef(null as {
  bundlesInfo: Uint8Array
  filesInfo: Uint8Array
  dirsInfo: Uint8Array
  pathReps: Uint8Array
  tableStats: TableStats[]
} | null)

export async function loadFileContent (fullPath: string, loader: BundleLoader) {
  const location = getFileInfo(fullPath, index.value!.bundlesInfo, index.value!.filesInfo)
  const bundleBin = await loader.fetchFile(location.bundle)

  const { slice } = await decompressFileInBundle(bundleBin.slice(0), location.offset, location.size)
  return slice
}

export async function loadIndex (indexBin: ArrayBuffer) {
  const { slice: indexBundle } = await decompressBundle(indexBin)
  const _index = readIndexBundle(indexBundle)
  const { slice: pathReps } = await decompressBundle(_index.pathRepsBundle.slice().buffer)
  index.value = {
    bundlesInfo: _index.bundlesInfo,
    filesInfo: _index.filesInfo,
    dirsInfo: _index.dirsInfo,
    pathReps: pathReps,
    tableStats: shallowReactive([])
  }
}

export interface TableStats {
  name: string
  totalRows: number
  headersValid: boolean
  increasedRowLength: boolean
}

export async function preloadDataTables (totalTables: Ref<number>, loader: BundleLoader) {
  const filePaths = getDirContent('Data', index.value!.pathReps, index.value!.dirsInfo)
    .files
    .filter(file => file.endsWith('.dat64')) // this also removes special `Languages.dat`

  totalTables.value = filePaths.length

  const filesInfo = await getBatchFileInfo(filePaths, index.value!.bundlesInfo, index.value!.filesInfo)

  const byBundle = filesInfo.reduce<Array<{
    name: string
    files: Array<{ fullPath: string, location: ReturnType<typeof getFileInfo> }>
  }>>((byBundle, location, idx) => {
    const found = byBundle.find(bundle => bundle.name === location.bundle)
    const fullPath = filePaths[idx]
    if (found) {
      found.files.push({ fullPath, location })
    } else {
      byBundle.push({
        name: location.bundle,
        files: [{ fullPath: filePaths[idx], location }]
      })
    }
    return byBundle
  }, [])

  for (const bundle of byBundle) {
    let bundleBin = await loader.fetchFile(bundle.name)
    for (const { fullPath, location } of bundle.files) {
      const res = await decompressFileInBundle(bundleBin, location.offset, location.size)
      bundleBin = res.bundle

      const datFile = readDatFile(fullPath, res.slice)
      const columnStats = await analyzeDatFile(datFile, { transfer: true })
      const name = fullPath.replace('Data/', '').replace('.dat64', '')

      const serialized = await findByName(name)
      const headers = fromSerializedHeaders(serialized, columnStats, datFile)

      index.value!.tableStats.push({
        name: name,
        totalRows: datFile.rowCount,
        headersValid: (headers != null),
        increasedRowLength: (headers) ? headers.increasedRowLength : false
      })
    }
  }
}
