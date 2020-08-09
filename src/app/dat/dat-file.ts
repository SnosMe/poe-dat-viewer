import { findSequence } from './reader'

export interface DatFile {
  name: string
  memsize: number
  rowCount: number
  rowLength: number
  dataFixed: Uint8Array
  dataVariable: Uint8Array
  readerFixed: BinaryReader
  readerVariable: BinaryReader
}

export async function importDatFile (name: string): Promise<DatFile> {
  const file = new Uint8Array(await loadFile(name))
  const fileReader = new DataView(file.buffer)
  const memsize = 4 // 4 or 8

  const rowCount = fileReader.getUint32(0, true)
  const boundary = findBBBB(file)
  const rowLength = (boundary - 4) / rowCount

  const dataFixed = file.subarray(4, boundary)
  const dataVariable = file.subarray(boundary)

  const readerFixed = new DataView(dataFixed.buffer, dataFixed.byteOffset, dataFixed.byteLength)
  const readerVariable = new DataView(dataVariable.buffer, dataVariable.byteOffset, dataVariable.byteLength)

  return Object.freeze({
    name,
    memsize,
    rowCount,
    rowLength,
    dataFixed,
    dataVariable,
    readerFixed: new BinaryReader(memsize, readerFixed),
    readerVariable: new BinaryReader(memsize, readerVariable)
  })
}

async function loadFile (name: string): Promise<ArrayBuffer> {
  const FILE_URL = `http://patch.poecdn.com/patch/3.11.1.5.2/Data/${name}.dat`

  const cache = await caches.open('poecdn')
  let res = await cache.match(FILE_URL)
  if (!res) {
    res = await fetch(`https://cors-anywhere.herokuapp.com/${FILE_URL}`)
    const buff = await res.arrayBuffer()
    await cache.put(FILE_URL, new Response(buff))
    return buff
  } else {
    return res.arrayBuffer()
  }
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
