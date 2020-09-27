import { _decompressSliceInBundle } from '../patchcdn/bundle.task'
import { _unpackPaths } from '../patchcdn/index-paths.task'

const ctx = (self as unknown) as Worker

ctx.addEventListener('message', async (e) => {
  try {
    switch ((e.data as { type: string }).type) {
      case 'decompressSliceInBundle': {
        const data = e.data as { bundle: Uint8Array, sliceOffset?: number, sliceSize?: number }
        const result = await _decompressSliceInBundle(data.bundle, data.sliceOffset, data.sliceSize)
        ctx.postMessage([null, result], [result.buffer])
        break
      }
      case 'unpackIndexPaths': {
        const data = e.data as { pathBundle: Uint8Array, pathReps: Uint8Array }
        const result = _unpackPaths(data.pathBundle, data.pathReps)
        ctx.postMessage([null, result])
        break
      }
    }
  } catch (e) {
    ctx.postMessage([e, null])
  }
})
