import * as Comlink from 'comlink'
import { decompressSliceInBundle, decompressedBundleSize, getFileInfo } from 'pathofexile-dat/bundles.js'
import { type DatFile, analyzeDatFile } from 'pathofexile-dat/dat.js'

const WorkerBody = {
  async decompressSliceInBundle (bundle: ArrayBufferLike, sliceOffset?: number, sliceSize?: number) {
    const _bundle = new Uint8Array(bundle)
    const decompressedSlice = new Uint8Array(sliceSize || decompressedBundleSize(_bundle))
    decompressSliceInBundle(_bundle, sliceOffset || 0, decompressedSlice)
    return {
      bundle: Comlink.transfer(bundle, [bundle]),
      slice: Comlink.transfer(decompressedSlice, [decompressedSlice.buffer])
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
