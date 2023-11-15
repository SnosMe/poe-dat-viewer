import * as Comlink from 'comlink'
import { decompressSliceInBundle, getFileInfo } from 'pathofexile-dat/bundles.js'
import { type DatFile, analyzeDatFile } from 'pathofexile-dat/dat.js'

const WorkerBody = {
  async decompressSliceInBundle (bundle: ArrayBuffer, sliceOffset?: number, sliceSize?: number) {
    const slice = decompressSliceInBundle(new Uint8Array(bundle), sliceOffset, sliceSize)
    return {
      bundle: Comlink.transfer(bundle, [bundle]),
      slice: Comlink.transfer(slice, [slice.buffer])
    }
  },
  async analyzeDatFile (datFile: DatFile) {
    return analyzeDatFile(datFile)
  },
  async getBatchFileInfo (paths: string[], bundlesInfo: Uint8Array, filesInfo: Uint8Array) {
    return paths.map(fullPath =>
      getFileInfo(fullPath, bundlesInfo, filesInfo))
  }
}

Comlink.expose(WorkerBody)

export type WorkerRPC = Comlink.Remote<typeof WorkerBody>
