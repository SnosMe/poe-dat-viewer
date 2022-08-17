import Worker from './script?worker'
import * as Comlink from 'comlink'
import type { WorkerRPC } from './script.js'
import type { DatFile } from 'pathofexile-dat'

const thread = Comlink.wrap<WorkerRPC>(new Worker())

export async function decompressBundle (bundle: ArrayBuffer) {
  return await thread.decompressSliceInBundle(
    Comlink.transfer(bundle, [bundle])
  )
}

export async function decompressFileInBundle (bundle: ArrayBuffer, offset: number, size: number) {
  return await thread.decompressSliceInBundle(
    Comlink.transfer(bundle, [bundle]),
    offset,
    size
  )
}

export async function analyzeDatFile (datFile: DatFile, opts?: { transfer: true }) {
  return await thread.analyzeDatFile(Comlink.transfer(datFile, opts?.transfer ? [datFile.dataFixed.buffer] : []))
}

export async function getBatchFileInfo (paths: string[], bundlesInfo: Uint8Array, filesInfo: Uint8Array) {
  return await thread.getBatchFileInfo(paths, bundlesInfo, filesInfo)
}
