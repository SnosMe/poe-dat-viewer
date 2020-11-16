import { decompressBundle, decompressFileTransferBundle } from '../worker/interface'
import { readIndexBundle, getFileInfo } from 'pathofexile-dat/bundles/index-bundle'
import { fetchFile } from './cache'
import { shallowRef } from 'vue'

export const index = shallowRef(null as {
  bundlesInfo: Uint8Array
  filesInfo: Uint8Array
  dirsInfo: Uint8Array
  pathReps: Uint8Array
} | null)

export async function loadFileContent (fullPath: string) {
  const location = getFileInfo(fullPath, index.value!.bundlesInfo, index.value!.filesInfo)
  const bundleBin = await fetchFile(null, location.bundle)

  return decompressFileTransferBundle(bundleBin, location.offset, location.size)
}

export async function loadIndex (indexBin: ArrayBuffer) {
  const indexBundle = await decompressBundle(new Uint8Array(indexBin))
  const _index = readIndexBundle(indexBundle)
  index.value = {
    bundlesInfo: _index.bundlesInfo,
    filesInfo: _index.filesInfo,
    dirsInfo: _index.dirsInfo,
    pathReps: await decompressBundle(_index.pathRepsBundle)
  }
}
