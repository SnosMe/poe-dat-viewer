import type { DatFile } from './dat/dat-file'
import type { ColumnStats } from './dat-analysis/stats'
import Module from './compute'

let module_: ReturnType<typeof Module>

function load () {
  if (!module_) {
    module_ = Module()
  }
  return module_
}

export async function analyzeDatFile (file: DatFile) {
  const module = await load()

  const dataFixedPtr = module._malloc(file.dataFixed.byteLength)
  module.HEAPU8.set(file.dataFixed, dataFixedPtr)
  const dataVariablePtr = module._malloc(file.dataVariable.byteLength)
  module.HEAPU8.set(file.dataVariable, dataVariablePtr)

  const statsPtr = module._malloc(STATS_SIZE * file.rowLength)

  const analyzeDat = (file.memsize === 4)
    ? module._fast_analyze_dat32
    : module._fast_analyze_dat64
  analyzeDat(
    dataFixedPtr, file.dataFixed.byteLength,
    dataVariablePtr, file.dataVariable.byteLength,
    file.rowLength,
    statsPtr)

  const stats = unpackStats(
    module.HEAPU8.subarray(statsPtr, statsPtr + (STATS_SIZE * file.rowLength)),
    file.rowLength
  )

  module._free(dataFixedPtr)
  module._free(dataVariablePtr)
  module._free(statsPtr)

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
