import type { DatFile } from '../dat/dat-file'

export interface Header {
  offset: number
  type: {
    array?: boolean
    boolean?: {}
    integer?: { unsigned: boolean, size: number }
    decimal?: { size: number }
    string?: {}
    key?: { foreign: boolean }
  }
}

export function getHeaderLength (header: Pick<Header, 'type'>, datFile: DatFile) {
  const { type } = header
  const { fieldSize } = datFile

  if (type.array) {
    return fieldSize.ARRAY
  } else if (type.string) {
    return fieldSize.STRING
  } else if (type.key) {
    return type.key.foreign ? fieldSize.KEY_FOREIGN : fieldSize.KEY
  } else if (type.integer) {
    return type.integer.size
  } else if (type.decimal) {
    return type.decimal.size
  } else if (type.boolean) {
    return fieldSize.BOOL
  }

  throw new Error('Corrupted header')
}
