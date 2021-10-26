
export interface ColumnStats {
  maxValue: number
  nullableMemsize: boolean
  keySelf: boolean
  keyForeign: boolean
  refString: boolean
  refArray: {
    boolean: boolean
    numeric32: boolean
    string: boolean
    keyForeign: boolean
    keySelf: boolean
  } | false
}
