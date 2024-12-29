import type { ColumnStats } from './stats.js'
import type { Header } from '../dat/header.js'

export function validateHeader (header: Header, columns: ColumnStats[]): boolean {
  if (header.offset >= columns.length) {
    return false
  }

  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.array
  const key = header.type.key
  const size = integer?.size || decimal?.size
  const count = (header.type.interval) ? 2 : 1

  const space = columns.length - header.offset
  const stats = columns[header.offset]

  if (integer) {
    // if (size === 1 && !array) return space >= 1 * count
    if (size === 2 && !array) return space >= 2 * count
    if (size === 4 && !array) return space >= 4 * count
    // if (size === 8 && !array) return space >= 8 * count

    // if (size === 1 && array) return stats.refArray && true
    // if (size === 2 && array) return stats.refArray && stats.refArray.short
    if (size === 4 && array) return stats.refArray && stats.refArray.numeric32
    // if (size === 8 && array) return stats.refArray && stats.refArray.longLong
  }

  if (decimal) {
    if (size === 4 && !array) return space >= 4 * count
    // if (size === 8 && !array) return space >= 8 * count

    if (size === 4 && array) return stats.refArray && stats.refArray.numeric32
    // if (size === 8 && array) return stats.refArray && stats.refArray.longLong
  }

  if (boolean) {
    return array
      ? stats.refArray && stats.refArray.boolean
      : stats.maxValue <= 0x01
  }

  if (string) {
    return array
      ? stats.refArray && stats.refArray.string
      : stats.refString
  }

  if (key && key.foreign) {
    return array
      ? stats.refArray && stats.refArray.keyForeign
      : stats.keyForeign
  }

  if (key && !key.foreign) {
    return array
      ? stats.refArray && stats.refArray.keySelf
      : stats.keySelf
  }

  if (array) {
    return Boolean(stats.refArray)
  }

  throw new Error('Unexpected type')
}
