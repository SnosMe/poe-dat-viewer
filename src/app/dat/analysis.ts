
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

export const STATS_SIZE = 12

export function unpackStats (data: Uint8Array, rowLength: number) {
  return new Array(rowLength).fill(undefined)
    .map<ColumnStats>((_, idx) => ({
      bMax: data[(STATS_SIZE * idx) + 0],
      nullableMemsize: !!data[(STATS_SIZE * idx) + 1],
      keySelf: !!data[(STATS_SIZE * idx) + 2],
      refString: !!data[(STATS_SIZE * idx) + 3],
      refArray: data[(STATS_SIZE * idx) + 4] ? {
        boolean: !!data[(STATS_SIZE * idx) + 5],
        short: !!data[(STATS_SIZE * idx) + 6],
        long: !!data[(STATS_SIZE * idx) + 7],
        longLong: !!data[(STATS_SIZE * idx) + 8],
        string: !!data[(STATS_SIZE * idx) + 9],
        keyForeign: !!data[(STATS_SIZE * idx) + 10],
        keySelf: !!data[(STATS_SIZE * idx) + 11]
      } : false
    }))
}
