import { findZeroSequence } from '../utils/findSequence'
import type { BinaryReader } from '../utils/BinaryReader'
import type { DatFile } from './dat-file'
import type { Header } from './header'

export const INT32_NULL = 0xfefefefe
export const INT64_NULL = 0xfefefefefefefefe

const TEXT_DECODER = new TextDecoder('utf-16le')
const STRING_TERMINATOR = 4

export const FIELD_SIZE = {
  BOOL: 1,
  BYTE: 1,
  SHORT: 2,
  LONG: 4,
  LONGLONG: 8,
  STRING: {
    4: 4,
    8: 8
  } as Record<number, number>,
  KEY: {
    4: 4,
    8: 8
  } as Record<number, number>,
  KEY_FOREIGN: {
    4: 4 + 4,
    8: 8 + 8
  } as Record<number, number>,
  ARRAY: {
    4: 4 + 4,
    8: 8 + 8
  } as Record<number, number>
}

export type DatKeySelf = number | null
export type DatKeyForeign = number | null
// export type DatKeyForeign = { rid: number, unknown: number } | null

export function readInteger (data: BinaryReader, size: number, unsigned: boolean): (offset: number) => number {
  if (size === 1 && unsigned) return (offset) => data.getUint8(offset)
  else if (size === 2 && unsigned) return (offset) => data.getUint16(offset)
  else if (size === 4 && unsigned) return (offset) => data.getUint32(offset)
  else if (size === 8 && unsigned) return (offset) => Number(data.getBigUint64(offset))
  else if (size === 1 && !unsigned) return (offset) => data.getInt8(offset)
  else if (size === 2 && !unsigned) return (offset) => data.getInt16(offset)
  else if (size === 4 && !unsigned) return (offset) => data.getInt32(offset)
  else if (size === 8 && !unsigned) return (offset) => Number(data.getBigInt64(offset))

  throw new Error('never')
}

export function readDecimal (data: BinaryReader, size: number): (offset: number) => number {
  if (size === 4) return (offset) => data.getFloat32(offset)
  else if (size === 8) return (offset) => data.getFloat64(offset)

  throw new Error('never')
}

export function readString (data: Uint8Array): (offset: number) => string {
  return offset => {
    let end = findZeroSequence(data, STRING_TERMINATOR, offset)
    while ((end - offset) % 2 !== 0) {
      end = findZeroSequence(data, STRING_TERMINATOR, end + 1)
    }
    return TEXT_DECODER.decode(data.subarray(offset, end))
  }
}

export function isNULL (value: number, memsize: number) {
  return value === (memsize === 4 ? INT32_NULL : INT64_NULL)
}

export function getNULL (memsize: number) {
  return (memsize === 4) ? INT32_NULL : INT64_NULL
}

export function readKeySelf (data: BinaryReader): (offset: number) => DatKeySelf {
  const NULL = getNULL(data.ptrsize)
  return offset => {
    const rowIdx = data.getSizeT(offset)
    return (rowIdx === NULL) ? null : rowIdx
  }
}

export function readKeyForeign (data: BinaryReader): (offset: number) => DatKeyForeign {
  const NULL = getNULL(data.ptrsize)
  return offset => {
    const rowIdx = data.getSizeT(offset)
    return (rowIdx === NULL) ? null : rowIdx
    // return (rowIdx === NULL) ? null : { rid: rowIdx, unknown: data.getSizeT(offset + data.ptrsize) }
  }
}

export function getScalarReader (header: Header, datFile: DatFile) {
  const { type } = header
  const { dataFixed, dataVariable, readerFixed } = datFile

  if (type.boolean) {
    return (offset: number) => Boolean(dataFixed[offset])
  }
  if (type.string) {
    const readString_ = readString(dataVariable)
    return (offset: number) => {
      const varOffset = readerFixed.getSizeT(offset)
      return readString_(varOffset)
    }
  }
  if (type.integer) {
    return readInteger(readerFixed, type.integer.size, type.integer.unsigned)
  }
  if (type.decimal) {
    return readDecimal(readerFixed, type.decimal.size)
  }
  if (type.key) {
    if (type.key.foreign) {
      return readKeyForeign(readerFixed)
    } else {
      return readKeySelf(readerFixed)
    }
  }

  throw new Error('never')
}

export function getArrayReader (header: Header, datFile: DatFile) {
  const { type } = header
  const { dataVariable, readerVariable } = datFile

  const [elSize, reader] = (() => {
    if (type.boolean) {
      return [
        1,
        (offset: number) => Boolean(dataVariable[offset])
      ] as const
    }
    if (type.string) {
      const readString_ = readString(dataVariable)
      return [
        datFile.fieldSize.STRING,
        (offset: number) => {
          const varOffset = readerVariable.getSizeT(offset)
          return readString_(varOffset)
        }
      ] as const
    }
    if (type.integer) {
      return [
        type.integer.size,
        readInteger(readerVariable, type.integer.size, type.integer.unsigned)
      ] as const
    }
    if (type.decimal) {
      return [
        type.decimal.size,
        readDecimal(readerVariable, type.decimal.size)
      ] as const
    }
    if (type.key) {
      if (type.key.foreign) {
        return [
          datFile.fieldSize.KEY_FOREIGN,
          readKeyForeign(readerVariable)
        ] as const
      } else {
        return [
          datFile.fieldSize.KEY,
          readKeySelf(readerVariable)
        ] as const
      }
    }

    throw new Error('never')
  })()

  return (offset: number) => {
    const arrayLength = datFile.readerFixed.getSizeT(offset)
    if (arrayLength === 0) {
      return []
    }

    const varOffset = datFile.readerFixed.getSizeT(offset + datFile.memsize)
    const out = Array(arrayLength).fill(undefined)
    return out.map((_, elIdx) => reader(varOffset + (elIdx * elSize)))
  }
}

export function getFieldReader (header: Header, datFile: DatFile) {
  const reader = (header.type.array)
    ? getArrayReader(header, datFile)
    : getScalarReader(header, datFile)

  return function readFieldAtRow (rowIdx: number) {
    return reader((rowIdx * datFile.rowLength) + header.offset)
  }
}

export function readColumn (header: Header, datFile: DatFile) {
  const reader = getFieldReader(header, datFile)
  const out = Array(datFile.rowCount).fill(undefined)
  return out.map((_, rowIdx) => reader(rowIdx))
}
