/// <reference types="emscripten" />

import type { DatFile } from '../dat/dat-file'
import type { ColumnStats } from './stats'

interface Native extends EmscriptenModule {
  _app_analyze_dat(
    dataFixedPtr: number, dataFixed_len: number,
    dataVariablePtr: number, dataVariable_len: number,
    row_len: number,
    statsPtr: number
  ): void
}

const Module = require('./app.js') as EmscriptenModuleFactory<Native>

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

  module._app_analyze_dat(
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

const STATS_SIZE = 12

function unpackStats (data: Uint8Array, rowLength: number) {
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
