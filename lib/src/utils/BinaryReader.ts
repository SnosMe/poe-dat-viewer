export class BinaryReader {
  private _data: DataView

  constructor (data: DataView) {
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

  getSizeT (byteOffset: number) {
    return Number(this._data.getBigUint64(byteOffset, true))
  }
}
