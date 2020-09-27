import { DatSerializedHeader } from '../exporters/internal'
import { findByName } from './db'
import { findSequence } from './reader'

export interface DatFile {
  meta: {
    name: string
    headers: DatSerializedHeader[]
  }
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

export async function importFromFile (name: string, content: ArrayBuffer): Promise<DatFile> {
  return Object.freeze({
    meta: {
      name: getNamePart(name),
      headers: await findByName(getNamePart(name))
    },
    ...initDatFile(name, content)
  })
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
