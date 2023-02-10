import type { DatFile } from '../dat/dat-file.js'
import type { ColumnStats } from './stats.js'

let _module: ModuleExports

type AnalyzeFn = (
  dataFixedPtr: number, dataFixed_len: number,
  dataVariablePtr: number, dataVariable_len: number,
  row_len: number,
  statsPtr: number
) => void

interface ModuleExports {
  memory: WebAssembly.Memory
  fast_analyze_dat64: AnalyzeFn
  malloc: (size: number) => number
  free: (ptr: number, size: number) => void
}

export function setWasmExports (module: ModuleExports) {
  _module = module
}

export function analyzeDatFile (file: DatFile): ColumnStats[] {
  if (!file.dataFixed.byteLength) return []

  const dataFixedPtr = _module.malloc(file.dataFixed.byteLength)
  const dataVariablePtr = _module.malloc(file.dataVariable.byteLength)
  const statsPtr = _module.malloc(STATS_SIZE * file.rowLength)

  const HEAPU8 = new Uint8Array(_module.memory.buffer)
  HEAPU8.set(file.dataFixed, dataFixedPtr)
  HEAPU8.set(file.dataVariable, dataVariablePtr)

  _module.fast_analyze_dat64(
    dataFixedPtr, file.dataFixed.byteLength,
    dataVariablePtr, file.dataVariable.byteLength,
    file.rowLength,
    statsPtr)

  const stats = unpackStats(
    HEAPU8.subarray(statsPtr, statsPtr + (STATS_SIZE * file.rowLength)),
    file.rowLength
  )

  _module.free(dataFixedPtr, file.dataFixed.byteLength)
  _module.free(dataVariablePtr, file.dataVariable.byteLength)
  _module.free(statsPtr, STATS_SIZE * file.rowLength)

  return stats
}

const STATS_SIZE = 11

function unpackStats (data: Uint8Array, rowLength: number) {
  return new Array(rowLength).fill(undefined)
    .map<ColumnStats>((_, idx) => ({
      maxValue: data[(STATS_SIZE * idx) + 0],
      nullableMemsize: !!data[(STATS_SIZE * idx) + 1],
      keySelf: !!data[(STATS_SIZE * idx) + 2],
      keyForeign: !!data[(STATS_SIZE * idx) + 3],
      refString: !!data[(STATS_SIZE * idx) + 4],
      refArray: data[(STATS_SIZE * idx) + 6] ? {
        boolean: !!data[(STATS_SIZE * idx) + 5],
        numeric32: !!data[(STATS_SIZE * idx) + 7],
        string: !!data[(STATS_SIZE * idx) + 8],
        keyForeign: !!data[(STATS_SIZE * idx) + 9],
        keySelf: !!data[(STATS_SIZE * idx) + 10]
      } : false
    }))
}
