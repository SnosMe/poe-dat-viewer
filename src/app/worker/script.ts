import * as Comlink from 'comlink'
import { decompressSliceInBundle } from '../bundles/bundle'

const WorkerBody = {
  async decompressSliceInBundle (bundle: Uint8Array, sliceOffset?: number, sliceSize?: number) {
    const result = await decompressSliceInBundle(bundle, sliceOffset, sliceSize)
    return Comlink.transfer(result, [result.buffer])
  }
}

Comlink.expose(WorkerBody)

export type WorkerRPC = Comlink.Remote<typeof WorkerBody>
