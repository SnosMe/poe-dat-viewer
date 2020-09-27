/* eslint-disable import/no-webpack-loader-syntax */
import SingleThreadWorker from 'worker-loader!./script'
import type { _decompressSliceInBundle } from '../patchcdn/bundle.task'
import type { _unpackPaths } from '../patchcdn/index-paths.task'

const worker = new SingleThreadWorker()

let work_: Promise<unknown> | null = null
let resolve_: Function
let reject_: Function

worker.addEventListener('message', (e) => {
  work_ = null
  if (e.data[0] != null) {
    reject_(e.data[0])
  } else {
    resolve_(e.data[1])
  }
})

async function queueWork<T> (fn: () => void): Promise<T> {
  if (work_) {
    try { await work_ } catch (e) {}
    return queueWork(fn)
  }

  fn()

  work_ = new Promise((resolve, reject) => {
    resolve_ = resolve
    reject_ = reject
  })
  return work_ as Promise<T>
}

export async function decompressBundle (bundle: Uint8Array) {
  return queueWork<ReturnType<typeof _decompressSliceInBundle>>(() => {
    if (bundle.byteOffset === 0 && bundle.byteLength === bundle.buffer.byteLength) {
      worker.postMessage({ type: 'decompressSliceInBundle', bundle }, [/* bundle.buffer */])
    } else {
      const bundleSlice = new Uint8Array(
        bundle.buffer.slice(bundle.byteOffset, bundle.byteOffset + bundle.byteLength))
      worker.postMessage({ type: 'decompressSliceInBundle', bundle: bundleSlice }, [bundleSlice.buffer])
    }
  })
}

export async function decompressFileTransferBundle (bundle: ArrayBuffer, offset: number, size: number) {
  return queueWork<ReturnType<typeof _decompressSliceInBundle>>(() => {
    worker.postMessage({
      type: 'decompressSliceInBundle',
      bundle: new Uint8Array(bundle),
      sliceOffset: offset,
      sliceSize: size
    }, [bundle])
  })
}

export async function unpackIndexPaths (pathBundle: Uint8Array, pathReps: Uint8Array) {
  // NOTE: for some reason in Chromium it's x2.2 slower in Worker than on main thread
  // however in Firefox works as expected (same perf as in main)
  return queueWork<ReturnType<typeof _unpackPaths>>(() => {
    worker.postMessage({
      type: 'unpackIndexPaths',
      pathBundle,
      pathReps
    }, [
      pathBundle.buffer
      /* pathReps.buffer */
    ])
  })
}
