/* eslint-disable import/no-webpack-loader-syntax */
import Worker from 'worker-loader!./script'
import * as Comlink from 'comlink'
import type { WorkerRPC } from './script'

const thread = Comlink.wrap<WorkerRPC>(new Worker())

export function decompressBundle (bundle: Uint8Array) {
  if (bundle.byteOffset === 0 && bundle.byteLength === bundle.buffer.byteLength) {
    return thread.decompressSliceInBundle(bundle)
  } else {
    const bundleSlice = new Uint8Array(
      bundle.buffer.slice(bundle.byteOffset, bundle.byteOffset + bundle.byteLength)
    )
    return thread.decompressSliceInBundle(Comlink.transfer(bundle, [bundleSlice.buffer]))
  }
}

export function decompressFileTransferBundle (bundle: ArrayBuffer, offset: number, size: number) {
  return thread.decompressSliceInBundle(
    Comlink.transfer(new Uint8Array(bundle), [bundle]),
    offset,
    size
  )
}
