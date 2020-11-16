
export interface ColumnStats {
  bMax: number
  nullableMemsize: boolean
  keySelf: boolean
  refString: boolean
  refArray: {
    boolean: boolean
    short: boolean
    long: boolean
    longLong: boolean
    string: boolean
    keyForeign: boolean
    keySelf: boolean
  } | false
}
