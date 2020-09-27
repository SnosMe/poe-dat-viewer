import { Header } from '../viewer/headers'
import { ColumnStats } from '../dat/analysis'

export interface DatSerializedHeader {
  name: string | null
  length?: number
  type: {
    ref?: { array: boolean }
    boolean?: {}
    integer?: { unsigned: boolean, size: number }
    decimal?: { size: number }
    string?: {}
    key?: { foreign: boolean }
  }
}

export function exportInternalState (headers: Header[], name: string) {
  return JSON.stringify({
    name: name,
    headers: serializeHeaders(headers)
  }, null, 2)
}

export function serializeHeaders (headers: Header[]) {
  return headers.map<DatSerializedHeader>(header => ({
    name: header.name,
    length: (header.type.ref || header.type.key) ? undefined : header.length,
    type: {
      ...header.type,
      byteView: undefined
    }
  }))
}

export function getHeaderLength (header: DatSerializedHeader, memsize: number) {
  if (header.length) return header.length

  if (header.type.ref?.array) {
    return memsize * 2
  } else if (header.type.string) {
    return memsize
  } else if (header.type.key) {
    return header.type.key.foreign
      ? memsize * 2
      : memsize
  }

  throw new Error('Corrupted header')
}

export function validateImportedHeader (
  header: Pick<Header, 'type' | 'offset' | 'length'>,
  columns: ColumnStats[]
): boolean {
  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.ref?.array
  const key = header.type.key
  const size = integer?.size || decimal?.size

  // NOTE: keep in sync with `HeaderProps.vue`

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
      : space >= header.length
  }

  if (key && !key.foreign) {
    return array
      ? stats.refArray && stats.refArray.keySelf
      : stats.keySelf
  }

  return space >= header.length
}
