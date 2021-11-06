import { shallowRef, shallowReactive, Ref, watch } from 'vue'
import { readDatFile } from 'pathofexile-dat'
import { getDirContent, getRootDirs, getFileInfo, readIndexBundle } from 'pathofexile-dat/bundles'
import { decompressBundle, decompressFileInBundle, getBatchFileInfo, analyzeDatFile } from '../worker/interface'
import type { BundleLoader } from './cache'
import { findByName } from '../dat-viewer/db'
import { fromSerializedHeaders } from '@/app/dat-viewer/headers'
import * as perf from '@/perf'

export class BundleIndex {
  constructor (
    public readonly loader: BundleLoader
  ) {}

  private readonly index = shallowRef(null as {
    bundlesInfo: Uint8Array
    filesInfo: Uint8Array
    dirsInfo: Uint8Array
    pathReps: Uint8Array
    tableStats: TableStats[]
  } | null)

  get tableStats () {
    return this.index.value!.tableStats
  }

  get isLoaded () {
    return this.index.value != null
  }

  async loadIndex () {
    const indexBin = await this.loader.fetchFile('_.index.bin')
    const { slice: indexBundle } = await decompressBundle(indexBin)
    const _index = readIndexBundle(indexBundle)
    const { slice: pathReps } = await decompressBundle(_index.pathRepsBundle.slice().buffer)
    this.index.value = {
      bundlesInfo: _index.bundlesInfo,
      filesInfo: _index.filesInfo,
      dirsInfo: _index.dirsInfo,
      pathReps: pathReps,
      tableStats: shallowReactive([])
    }
  }

  async loadFileContent (fullPath: string) {
    const { bundlesInfo, filesInfo } = this.index.value!
    const location = getFileInfo(fullPath, bundlesInfo, filesInfo)
    const bundleBin = await this.loader.fetchFile(location.bundle)

    const { slice } = await decompressFileInBundle(bundleBin.slice(0), location.offset, location.size)
    return slice
  }

  getDirContent (dirPath: string) {
    const { pathReps, dirsInfo } = this.index.value!
    return perf.fn(`[Index] getting "${dirPath}" dir`, () =>
      getDirContent(dirPath, pathReps, dirsInfo))
  }

  getRootDirs () {
    const { pathReps, dirsInfo } = this.index.value!
    return perf.fn('[Index] getting root dirs', () =>
      getRootDirs(pathReps, dirsInfo))
  }

  async getBatchFileInfo (paths: string[]) {
    const { bundlesInfo, filesInfo } = this.index.value!
    return await getBatchFileInfo(paths, bundlesInfo, filesInfo)
  }

  watch (cb: () => void) {
    watch(this.index, cb)
  }
}

export interface TableStats {
  name: string
  totalRows: number
  headersValid: boolean
  increasedRowLength: boolean
}

export async function preloadDataTables (totalTables: Ref<number>, index: BundleIndex) {

  const filePaths = index.getDirContent('Data')
    .files
    .filter(file => file.endsWith('.dat64')) // this also removes special `Languages.dat`

  totalTables.value = filePaths.length

  const filesInfo = await index.getBatchFileInfo(filePaths)

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
    let bundleBin = await index.loader.fetchFile(bundle.name)
    for (const { fullPath, location } of bundle.files) {
      const res = await decompressFileInBundle(bundleBin, location.offset, location.size)
      bundleBin = res.bundle

      const datFile = readDatFile(fullPath, res.slice)
      const columnStats = await analyzeDatFile(datFile, { transfer: true })
      const name = fullPath.replace('Data/', '').replace('.dat64', '')

      const serialized = await findByName(name)
      const headers = fromSerializedHeaders(serialized, columnStats, datFile)

      index.tableStats.push({
        name: name,
        totalRows: datFile.rowCount,
        headersValid: (headers != null),
        increasedRowLength: (headers) ? headers.increasedRowLength : false
      })
    }
  }
}
