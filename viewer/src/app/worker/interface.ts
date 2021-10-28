import Worker from './script?worker'
import * as Comlink from 'comlink'
import type { WorkerRPC } from './script'
import type { DatFile } from 'pathofexile-dat'

const thread = Comlink.wrap<WorkerRPC>(new Worker())

export function decompressBundle (bundle: ArrayBuffer) {
  return thread.decompressSliceInBundle(
    Comlink.transfer(bundle, [bundle]),
  )
}

export function decompressFileInBundle (bundle: ArrayBuffer, offset: number, size: number) {
  return thread.decompressSliceInBundle(
    Comlink.transfer(bundle, [bundle]),
    offset,
    size
  )
}

export function analyzeDatFile (datFile: DatFile, opts?: { transfer: true }) {
  return thread.analyzeDatFile(Comlink.transfer(datFile, opts?.transfer ? [datFile.dataFixed.buffer] : []))
}

export function getBatchFileInfo (paths: string[], bundlesInfo: Uint8Array, filesInfo: Uint8Array) {
  return thread.getBatchFileInfo(paths, bundlesInfo, filesInfo)
}
