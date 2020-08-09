import { Header } from '../viewer/headers'
import { DatFile, BinaryReader } from './dat-file'

export const INT32_NULL = 0xfefefefe
export const INT64_NULL = 0xfefefefefefefefe
// TODO negative NULL
const TEXT_DECODER = new TextDecoder('utf-16le')
const STRING_TERMINATOR = [0x00, 0x00, 0x00, 0x00]

function readInteger (data: BinaryReader, offset: number, size: number, nullable: boolean, unsigned: boolean): number | null {
  let value!: number
  if (size === 1 && unsigned) value = data.getUint8(offset)
  else if (size === 2 && unsigned) value = data.getUint16(offset)
  else if (size === 4 && unsigned) value = data.getUint32(offset)
  else if (size === 8 && unsigned) value = Number(data.getBigUint64(offset))
  else if (size === 1 && !unsigned) value = data.getInt8(offset)
  else if (size === 2 && !unsigned) value = data.getInt16(offset)
  else if (size === 4 && !unsigned) value = data.getInt32(offset)
  else if (size === 8 && !unsigned) value = Number(data.getBigInt64(offset))

  if (nullable) {
    if (value === (size === 4 ? INT32_NULL : INT64_NULL)) {
      return null
    }
  }
  return value
}

function readDecimal (data: BinaryReader, offset: number, size: number): number {
  if (size === 4) {
    return data.getFloat32(offset)
  } else if (size === 8) {
    return data.getFloat64(offset)
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

function isNULL (value: number, memsize: number) {
  return value === (memsize === 4 ? INT32_NULL : INT64_NULL)
}

function readKeySelf (data: BinaryReader, offset: number): number | null {
  const rowIdx = data.getSizeT(offset)
  return isNULL(rowIdx, data.memsize) ? null : rowIdx
}

function readKeyForeign (data: BinaryReader, offset: number): [number, number] | null {
  const rowIdx = [data.getSizeT(offset), data.getSizeT(offset + data.memsize)] as [number, number]
  return isNULL(rowIdx[0], data.memsize) ? null : rowIdx
}

function readScalar (offset: number, header: Header, datFile: DatFile) {
  const { type } = header
  if (type.boolean) {
    return readBoolean(datFile.dataFixed, offset)
  }
  if (type.string) {
    const varOffset = datFile.readerFixed.getSizeT(offset)
    return readString(datFile.dataVariable, varOffset)
  }
  if (type.integer) {
    return readInteger(datFile.readerFixed, offset, type.integer.size, type.integer.nullable, type.integer.unsigned)
  }
  if (type.decimal) {
    return readDecimal(datFile.readerFixed, offset, type.decimal.size)
  }
  if (type.key) {
    if (type.key.foreign) {
      return readKeyForeign(datFile.readerFixed, offset)
    } else {
      return readKeySelf(datFile.readerFixed, offset)
    }
  }
  return undefined as never
}

function readArray (offset: number, header: Header, datFile: DatFile) {
  const { type } = header
  const arrayLength = datFile.readerFixed.getSizeT(offset)
  const varOffset = datFile.readerFixed.getSizeT(offset + datFile.memsize)

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
      readString(datFile.dataVariable, varOffset + (datFile.memsize * idx))
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
  if (type.key) {
    return out.map((_, idx) =>
      (type.key!.foreign)
        ? readKeyForeign(datFile.readerVariable, varOffset + ((datFile.memsize * 2) * idx))
        : readKeySelf(datFile.readerVariable, varOffset + (datFile.memsize * idx))
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
