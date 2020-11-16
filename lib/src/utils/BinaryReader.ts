
export type BinaryReader = BinaryReader4 | BinaryReader8

export class BinaryReaderFactory {
  protected _data: DataView

  static create (memsize: number, data: DataView) {
    if (memsize === 4) {
      return new BinaryReader4(data)
    } else {
      return new BinaryReader8(data)
    }
  }

  protected constructor (data: DataView) {
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

class BinaryReader4 extends BinaryReaderFactory {
  readonly ptrsize = 4
  
  constructor (data: DataView) {
    super(data)
  }

  getSizeT (byteOffset: number) {
    return this._data.getUint32(byteOffset, true)
  }
}
class BinaryReader8 extends BinaryReaderFactory {
  readonly ptrsize = 8

  constructor (data: DataView) {
    super(data)
  }

  getSizeT (byteOffset: number) {
    return Number(this._data.getBigUint64(byteOffset, true))
  }
}
