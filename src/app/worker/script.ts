import * as Comlink from 'comlink'
import { decompressSliceInBundle } from '../bundles/bundle'
import type { DatFile } from '../dat/dat-file'
import { analyzeDatFile } from './native'

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
