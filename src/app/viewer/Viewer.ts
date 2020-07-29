import Vue from 'vue'
import { importDatFile, DatFile } from '../dat/dat-file'
import { analyze, ColumnStats } from '../dat/analysis'
import { Header, createHeaderFromSelected } from './headers'
import { selectColsByHeader, clearColumnSelection } from './selection'
import { calcRowNumLength } from './formatting'
import { IMPORT_HDRS, IMPORT_DAT_NAME } from './_test_data'

export interface StateColumn {
  readonly offset: number
  readonly colNum99: string
  readonly colNum100: string
  selected: boolean
  header: Header | null
  dataStart: boolean
  readonly stats: {
    string: boolean
    array: boolean
    b00: boolean
    nullable: boolean
    bMax: string
  }
}

export const state = Vue.observable({
  headers: [] as Header[],
  columns: [] as StateColumn[],
  datFile: null as DatFile | null,
  columnStats: [] as ColumnStats[],
  rowIndexing: 0,
  colIndexing: 0,
  rowNumberLength: -1,
  editHeader: null as Header | null,
  config: {
    rowNumStart: 0,
    colNumStart: 0
  }
})

const ROW_NUM_MIN_LENGTH = 4

export async function importFile () {
  const parsed = await importDatFile(IMPORT_DAT_NAME)
  const rowNumLen = calcRowNumLength(parsed.rowCount, state.config.rowNumStart, ROW_NUM_MIN_LENGTH)

  state.datFile = parsed
  state.columnStats = analyze(state.datFile)
  state.columns = stateColumns(state.columnStats, state.config.colNumStart)
  state.headers = [{
    name: null,
    offset: 0,
    length: parsed.rowLength,
    type: {
      byteView: {}
    }
  }]

  for (const importedHeader of IMPORT_HDRS) {
    selectColsByHeader(importedHeader, state.columns)
    const header = createHeaderFromSelected(state.columns, state.headers)
    header.name = importedHeader.name
    clearColumnSelection(state.columns)
  }

  state.rowNumberLength = rowNumLen
}

export function stateColumns (columnStats: ColumnStats[], colNumStart: number) {
  const columns = new Array(columnStats.length).fill(undefined)
    .map<StateColumn>((_, idx) => ({
      offset: idx,
      colNum99: String((idx + colNumStart) % 100).padStart(2, '0'),
      // colNum100: String(Math.floor((idx + colNumStart) / 100)),
      colNum100: String(idx + colNumStart).padStart(2, '0'),
      selected: false,
      header: null,
      dataStart: false,
      stats: {
        string: false,
        array: false,
        b00: columnStats[idx].b00,
        bMax: columnStats[idx].bMax.toString(16).padStart(2, '0'),
        nullable: false
      }
    }))

  for (let idx = 0; idx < columnStats.length; idx += 1) {
    const stat = columnStats[idx]
    if (stat.refString) {
      columns[idx + 0].stats.string = true
      columns[idx + 1].stats.string = true
      columns[idx + 2].stats.string = true
      columns[idx + 3].stats.string = true
    }
    if (stat.refArray) {
      columns[idx + 0].stats.array = true
      columns[idx + 1].stats.array = true
      columns[idx + 2].stats.array = true
      columns[idx + 3].stats.array = true
      columns[idx + 4].stats.array = true
      columns[idx + 5].stats.array = true
      columns[idx + 6].stats.array = true
      columns[idx + 7].stats.array = true
    }
    if (stat.nullableLong) {
      columns[idx + 0].stats.nullable = true
      columns[idx + 1].stats.nullable = true
      columns[idx + 2].stats.nullable = true
      columns[idx + 3].stats.nullable = true
    }
  }

  return columns
}
