import * as Comlink from 'comlink'
import { decompressSliceInBundle } from 'pathofexile-dat/bundles/bundle'
import { analyzeDatFile } from 'pathofexile-dat/dat-analysis'
import type { DatFile } from 'pathofexile-dat'

const WorkerBody = {
  async decompressSliceInBundle (bundle: Uint8Array, sliceOffset?: number, sliceSize?: number): Promise<Uint8Array> {
    const result = await decompressSliceInBundle(bundle, sliceOffset, sliceSize)
    return Comlink.transfer(result, [result.buffer])
  },
  analyzeDatFile (datFile: DatFile) {
    return analyzeDatFile(datFile)
  }
}

Comlink.expose(WorkerBody)

export type WorkerRPC = Comlink.Remote<typeof WorkerBody>
