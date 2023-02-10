import { findZeroSequence } from '../utils/findSequence.js'
import type { DatFile } from './dat-file.js'
import type { Header } from './header.js'

export const MEM32_NULL = 0xfefefefe

const TEXT_DECODER = new TextDecoder('utf-16le')
const STRING_TERMINATOR = 4

export const FIELD_SIZE = {
  BOOL: 1,
  BYTE: 1,
  SHORT: 2,
  LONG: 4,
  LONGLONG: 8,
  STRING: 8, // uint16_t*
  KEY: 8, // size_t
  KEY_FOREIGN: 8 + 8, // struct { size_t rid; size_t unknown; }
  ARRAY: 8 + 8 // struct { size_t length; size_t offset; }
}

export type DatKeySelf = number | null
export type DatKeyForeign = number | null
// export type DatKeyForeign = { rid: number, unknown: number } | null
export type Scalar = DatKeyForeign | DatKeySelf | string | number | boolean

type One<T> = (reader: DataView, offset: number, dataVariable: Uint8Array) => T

const oneBool: One<boolean> = (reader, offset) => Boolean(reader.getUint8(offset))
const oneUint1: One<number> = (reader, offset) => reader.getUint8(offset)
const oneUint2: One<number> = (reader, offset) => reader.getUint16(offset, true)
const oneUint4: One<number> = (reader, offset) => reader.getUint32(offset, true)
const oneUint8: One<number> = (reader, offset) => Number(reader.getBigUint64(offset, true))
const oneInt1: One<number> = (reader, offset) => reader.getInt8(offset)
const oneInt2: One<number> = (reader, offset) => reader.getInt16(offset, true)
const oneInt4: One<number> = (reader, offset) => reader.getInt32(offset, true)
const oneInt8: One<number> = (reader, offset) => Number(reader.getBigInt64(offset, true))
const oneDecimal4: One<number> = (reader, offset) => reader.getFloat32(offset, true)
const oneDecimal8: One<number> = (reader, offset) => reader.getFloat64(offset, true)

const oneString: One<string> = (reader, offset, dataVariable) => {
  const varOffset = reader.getUint32(offset, true)
  return readStringAt(dataVariable, varOffset)
}
const oneKeySelf: One<DatKeySelf> = (reader, offset) => {
  const rowIdx = reader.getUint32(offset, true)
  return (rowIdx === MEM32_NULL) ? null : rowIdx
}
const oneKeyForeign: One<DatKeyForeign> = (reader, offset) => {
  const rowIdx = reader.getUint32(offset, true)
  return (rowIdx === MEM32_NULL) ? null : rowIdx
  // return (rowIdx === NULL) ? null : { rid: rowIdx, unknown: reader.getUint32(offset + data.memsize, true) }
}
function readStringAt (data: Uint8Array, offset: number): string {
  let end = findZeroSequence(data, STRING_TERMINATOR, offset)
  while ((end - offset) % 2 !== 0) {
    end = findZeroSequence(data, STRING_TERMINATOR, end + 1)
  }
  return TEXT_DECODER.decode(data.subarray(offset, end))
}

function readMany<T> (datFile: DatFile, offset: number, fn: One<T>, elSize: number): T[] {
  const { readerFixed } = datFile
  const arrayLength = readerFixed.getUint32(offset, true)
  if (arrayLength === 0) return []

  const { memsize, readerVariable, dataVariable } = datFile
  const varOffset = readerFixed.getUint32(offset + memsize, true)
  const out: T[] = []
  for (let i = 0; i < arrayLength; ++i) {
    out.push(fn(readerVariable, varOffset + i * elSize, dataVariable))
  }
  return out
}

export function getFieldReader (header: Header, datFile: DatFile) {
  const { type } = header
  const { fieldSize } = datFile
  let oneFn: One<Scalar>
  let elSize: number

  if (type.boolean) {
    oneFn = oneBool; elSize = fieldSize.BOOL
  } else if (type.string) {
    oneFn = oneString; elSize = fieldSize.STRING
  } else if (type.integer) {
    const { size, unsigned } = type.integer
    elSize = size
    if (size === 1 && unsigned) { oneFn = oneUint1 }
    else if (size === 2 && unsigned) { oneFn = oneUint2 }
    else if (size === 4 && unsigned) { oneFn = oneUint4 }
    else if (size === 8 && unsigned) { oneFn = oneUint8 }
    else if (size === 1 && !unsigned) { oneFn = oneInt1 }
    else if (size === 2 && !unsigned) { oneFn = oneInt2 }
    else if (size === 4 && !unsigned) { oneFn = oneInt4 }
    else if (size === 8 && !unsigned) { oneFn = oneInt8 }
  } else if (type.decimal) {
    elSize = type.decimal.size
    oneFn = (type.decimal.size === 4) ? oneDecimal4 : oneDecimal8
  } else if (type.key) {
    elSize = (type.key.foreign) ? fieldSize.KEY_FOREIGN : fieldSize.KEY
    oneFn = (type.key.foreign) ? oneKeyForeign : oneKeySelf
  }

  if (!type.array) {
    return function readScalarAtRow (rowIdx: number): Scalar {
      const offset = (rowIdx * datFile.rowLength) + header.offset
      return oneFn(datFile.readerFixed, offset, datFile.dataVariable)
    }
  } else {
    return function readArrayAtRow (rowIdx: number): Scalar[] {
      const offset = (rowIdx * datFile.rowLength) + header.offset
      return readMany(datFile, offset, oneFn, elSize)
    }
  }
}

export function readColumn (header: Header, datFile: DatFile) {
  const reader = getFieldReader(header, datFile)
  const out: Array<Scalar | Scalar[]> = []
  for (let rowIdx = 0; rowIdx < datFile.rowCount; ++rowIdx) {
    out.push(reader(rowIdx))
  }
  return out
}
