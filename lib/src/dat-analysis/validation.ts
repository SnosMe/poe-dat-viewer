import type { ColumnStats } from './stats'
import type { Header } from '../dat/header'
import type { DatFile } from '../dat/dat-file'

export function validateHeader (header: Header, columns: ColumnStats[], datFile: DatFile): boolean {
  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.array
  const key = header.type.key
  const size = integer?.size || decimal?.size

  const space = columns.length - header.offset
  const stats = columns[header.offset]

  if (integer) {
    if (size === 1 && !array) return space >= 1
    if (size === 2 && !array) return space >= 2
    if (size === 4 && !array) return space >= 4
    if (size === 8 && !array) return space >= 8

    if (size === 1 && array) return stats.refArray && true
    if (size === 2 && array) return stats.refArray && stats.refArray.short
    if (size === 4 && array) return stats.refArray && stats.refArray.long
    if (size === 8 && array) return stats.refArray && stats.refArray.longLong
  }

  if (decimal) {
    if (size === 4 && !array) return space >= 4
    if (size === 8 && !array) return space >= 8

    if (size === 4 && array) return stats.refArray && stats.refArray.long
    if (size === 8 && array) return stats.refArray && stats.refArray.longLong
  }

  if (boolean) {
    return array
      ? stats.refArray && stats.refArray.boolean
      : stats.bMax <= 0x01
  }

  if (string) {
    return array
      ? stats.refArray && stats.refArray.string
      : stats.refString
  }

  if (key && key.foreign) {
    return array
      ? stats.refArray && stats.refArray.keyForeign
      : space >= datFile.fieldSize.KEY_FOREIGN
  }

  if (key && !key.foreign) {
    return array
      ? stats.refArray && stats.refArray.keySelf
      : stats.keySelf
  }

  if (array) {
    return space >= datFile.fieldSize.ARRAY
  }

  throw new Error('Unexpected type')
}
