import { findSequence } from './reader'
import * as FileCache from './file-cache'

export interface DatFile {
  meta: FileCache.FileMeta
  memsize: number
  rowCount: number
  rowLength: number
  dataFixed: Uint8Array
  dataVariable: Uint8Array
  readerFixed: BinaryReader
  readerVariable: BinaryReader
}

function initDatFile (filename: string, content: ArrayBuffer) {
  if (content.byteLength < (4 + 8)) {
    throw new Error('Invalid file size')
  }

  const file = new Uint8Array(content)
  const fileReader = new DataView(file.buffer)
  const memsize = filename.endsWith('.dat64') ? 8 : 4

  const rowCount = fileReader.getUint32(0, true)
  const boundary = findBBBB(file)
  if (boundary === -1) {
    throw new Error('Invalid file: section with variable data not found')
  }
  const rowLength = (boundary - 4) / rowCount

  const dataFixed = file.subarray(4, boundary)
  const dataVariable = file.subarray(boundary)

  const readerFixed = new DataView(dataFixed.buffer, dataFixed.byteOffset, dataFixed.byteLength)
  const readerVariable = new DataView(dataVariable.buffer, dataVariable.byteOffset, dataVariable.byteLength)

  return {
    memsize,
    rowCount,
    rowLength,
    dataFixed,
    dataVariable,
    readerFixed: new BinaryReader(memsize, readerFixed),
    readerVariable: new BinaryReader(memsize, readerVariable)
  }
}

export async function importFromPoeCdn (patch: string, ggpkPath: string): Promise<DatFile> {
  if (!ggpkPath.startsWith('/')) {
    ggpkPath = '/' + ggpkPath
  }

  let file = await FileCache.findByPath(patch, ggpkPath)
  if (!file) {
    const FILE_URL = `http://patch.poecdn.com/patch/${patch}${ggpkPath}`
    const res = await fetch(`https://cors-anywhere.herokuapp.com/${FILE_URL}`)
    if (res.status !== 200) {
      throw new Error(`patch.poecdn.com: ${res.status} ${res.statusText}`)
    }
    file = await FileCache.putFile(patch, ggpkPath, await res.arrayBuffer())
  }
  return Object.freeze({
    meta: file.meta,
    ...initDatFile(file.meta.ggpkPath, file.content)
  })
}

export async function importFromFile (upload: File) {
  const file = await FileCache.putFile(null, upload.name, await upload.arrayBuffer())
  return Object.freeze({
    meta: file.meta,
    ...initDatFile(file.meta.ggpkPath, file.content)
  })
}

export async function getByHash (sha256: string) {
  const file = await FileCache.findByHash(sha256)
  if (file) {
    return Object.freeze({
      meta: file.meta,
      ...initDatFile(file.meta.ggpkPath, file.content)
    })
  }
}

export function getNamePart (path: string) {
  return path.match(/[^/]+(?=\..+$)/)![0]
}

function findBBBB (data: Uint8Array): number {
  return findSequence(data, [0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb])
}

export class BinaryReader {
  public memsize: 4 | 8
  private _data: DataView

  constructor (memsize: 4 | 8, data: DataView) {
    this.memsize = memsize
    this._data = data
  }

  get buffer () {
    return this._data.buffer
  }

  get byteLength () {
    return this._data.byteLength
  }

  get byteOffset () {
    return this._data.byteOffset
  }

  getSizeT (byteOffset: number) {
    if (this.memsize === 4) {
      return this._data.getUint32(byteOffset, true)
    } else {
      return Number(this._data.getBigUint64(byteOffset, true))
    }
  }

  getBigInt64 (byteOffset: number): bigint {
    return this._data.getBigInt64(byteOffset, true)
  }

  getBigUint64 (byteOffset: number): bigint {
    return this._data.getBigUint64(byteOffset, true)
  }

  getFloat32 (byteOffset: number): number {
    return this._data.getFloat32(byteOffset, true)
  }

  getFloat64 (byteOffset: number): number {
    return this._data.getFloat64(byteOffset, true)
  }

  getInt8 (byteOffset: number): number {
    return this._data.getInt8(byteOffset)
  }

  getInt16 (byteOffset: number): number {
    return this._data.getInt16(byteOffset, true)
  }

  getInt32 (byteOffset: number): number {
    return this._data.getInt32(byteOffset, true)
  }

  getUint8 (byteOffset: number): number {
    return this._data.getUint8(byteOffset)
  }

  getUint16 (byteOffset: number): number {
    return this._data.getUint16(byteOffset, true)
  }

  getUint32 (byteOffset: number): number {
    return this._data.getUint32(byteOffset, true)
  }
}
