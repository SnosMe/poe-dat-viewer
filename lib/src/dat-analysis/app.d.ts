/// <reference types="emscripten" />

type AnalyzeFn = (
  dataFixedPtr: number, dataFixed_len: number,
  dataVariablePtr: number, dataVariable_len: number,
  row_len: number,
  statsPtr: number
) => void

interface Native extends EmscriptenModule {
  _app_analyze_dat32: AnalyzeFn
  _app_analyze_dat64: AnalyzeFn
}

declare const ModuleFactory: EmscriptenModuleFactory<Native>

export default ModuleFactory
