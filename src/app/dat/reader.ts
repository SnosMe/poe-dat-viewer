import { Header } from '../viewer/headers'
import { DatFile } from './dat-file'

const INT32_NULL = 0xfefefefe
const INT64_NULL = BigInt('0xfefefefefefefefe')
const TEXT_DECODER = new TextDecoder('utf-16le')
const STRING_TERMINATOR = [0x00, 0x00, 0x00, 0x00]

function readInteger (data: DataView, offset: number, size: number, nullable: boolean, unsigned: boolean): number | null {
  let value!: number | bigint
  if (size === 1 && unsigned) value = data.getUint8(offset)
  if (size === 2 && unsigned) value = data.getUint16(offset, true)
  if (size === 4 && unsigned) value = data.getUint32(offset, true)
  if (size === 4 && !unsigned) value = data.getInt32(offset, true)
  if (size === 8 && unsigned) value = data.getBigUint64(offset, true)
  if (size === 8 && !unsigned) value = data.getBigInt64(offset, true)

  if (nullable) {
    if (value === INT32_NULL || value === INT64_NULL) {
      return null
    }
  }
  if (typeof value === 'bigint') {
    if (value > Number.MAX_SAFE_INTEGER) {
      // console.warn('Coercing BigInt to IEEE 754')
    }
    value = Number(value)
  }
  return value
}

function readDecimal (data: DataView, offset: number, size: number): number {
  if (size === 4) {
    return data.getFloat32(offset, true)
  } else if (size === 8) {
    return data.getFloat64(offset, true)
  }
  return undefined as never
}

function readString (data: Uint8Array, offset: number): string {
  let end = findSequence(data, STRING_TERMINATOR, offset)
  while ((end - offset) % 2 !== 0) {
    end = findSequence(data, STRING_TERMINATOR, end + 1)
  }
  return TEXT_DECODER.decode(data.subarray(offset, end))
}

function readBoolean (data: Uint8Array, offset: number): boolean {
  return Boolean(data[offset])
}

function readScalar (offset: number, header: Header, datFile: DatFile) {
  const { type } = header
  if (type.boolean) {
    return readBoolean(datFile.dataFixed, offset)
  }
  if (type.string) {
    const varOffset = datFile.readerFixed.getUint32(offset, true)
    return readString(datFile.dataVariable, varOffset)
  }
  if (type.integer) {
    return readInteger(datFile.readerFixed, offset, type.integer.size, type.integer.nullable, type.integer.unsigned)
  }
  if (type.decimal) {
    return readDecimal(datFile.readerFixed, offset, type.decimal.size)
  }
  return undefined as never
}

function readArray (offset: number, header: Header, datFile: DatFile) {
  const { type } = header
  const arrayLength = datFile.readerFixed.getUint32(offset, true)
  const varOffset = datFile.readerFixed.getUint32(offset + 4, true)

  if (arrayLength === 0) {
    return []
  }
  const out = Array(arrayLength).fill(undefined)

  if (type.boolean) {
    return out.map((_, idx) =>
      readBoolean(datFile.dataVariable, varOffset + (1 * idx))
    )
  }
  if (type.string) {
    return out.map((_, idx) =>
      readString(datFile.dataVariable, varOffset + (4 * idx))
    )
  }
  if (type.integer) {
    return out.map((_, idx) =>
      readInteger(datFile.readerVariable, varOffset + (type.integer!.size * idx), type.integer!.size, type.integer!.nullable, type.integer!.unsigned)
    )
  }
  if (type.decimal) {
    return out.map((_, idx) =>
      readDecimal(datFile.readerVariable, varOffset + (type.decimal!.size * idx), type.decimal!.size)
    )
  }
  return out as never
}

export function readCellValue (offset: number, header: Header, datFile: DatFile) {
  if (header.type.ref?.array) {
    return readArray(offset, header, datFile)
  } else {
    return readScalar(offset, header, datFile)
  }
}

export function findSequence (data: Uint8Array, sequence: number[], fromIndex = 0): number {
  const idx = data.indexOf(sequence[0], fromIndex)
  if (idx === -1 || (idx + sequence.length) > data.length) return -1

  for (let di = idx, si = 0; si < sequence.length; di += 1, si += 1) {
    if (data[di] !== sequence[si]) {
      return findSequence(data, sequence, di)
    }
  }

  return idx
}
