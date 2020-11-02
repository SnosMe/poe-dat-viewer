/// <reference types="emscripten" />

import type { DatFile } from '../dat/dat-file'
import { STATS_SIZE, unpackStats } from '../dat/analysis'

interface Native extends EmscriptenModule { /* eslint-disable @typescript-eslint/camelcase */
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
