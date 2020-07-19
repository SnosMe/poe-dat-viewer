import Vue from 'vue'
import { parse } from './file'

interface Header {
  name: string
  start: number
  length: number
  type: {
    byteView?: {}
    array?: {}
    boolean?: {}
    integer?: { unsigned: boolean, nullable: boolean }
    decimal?: {}
    string?: {}
  }
}

interface StateColumn {
  idx: number
  idx99: string
  idx100: string
  selected: boolean
  header: number
  dataEnd: boolean
}

type DataRow = Uint8Array

export const state = Vue.observable({
  headers: [] as Header[],
  columns: [] as StateColumn[],
  parsed: null,
  rowIndexing: 0,
  colIndexing: 0,
  rowNumberLength: -1
})

const IMPORT_HDRS: Header[] = [
  {
    name: 'Id',
    start: 0,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'ItemClassesKey',
    start: 4,
    length: 8,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Unknown0',
    start: 12,
    length: 199,
    type: {
      byteView: {}
    }
  }
]

const ROW_NUM_MIN_LENGTH = 4
const ROW_NUM_START = 0
const COL_NUM_START = 0

export function importFile () {
  const parsed = parse()
  const rowNumLen = calcRowNumLength(parsed.rows, ROW_NUM_START, ROW_NUM_MIN_LENGTH)

  state.parsed = Object.freeze({
    name: parsed.name,
    rows: stateFromRows(parsed.rows, rowNumLen, ROW_NUM_START),
    variableData: parsed.variableData
  }) as any

  state.columns = stateColumns(parsed.rows[0].length, COL_NUM_START) as any

  for (const importedHeader of IMPORT_HDRS) {
    selectColsByHeader(importedHeader, state.columns)
    const header = createHeaderFromSelected(state.columns, state.headers)
    header.name = importedHeader.name
    clearColumnSelection(state.columns)
  }

  const fmt = getRowFormating(state.columns)
  console.log(formatRow(parsed.rows[0], fmt))

  state.rowNumberLength = rowNumLen
}

export function calcRowNumLength (rows: DataRow[], rowNumStart: number, minLength: number) {
  const maxLen = String(rows.length - 1 + rowNumStart).length
  return Math.max(maxLen, minLength)
}

export function stateFromRows (rows: DataRow[], padRowNum: number, rowNumStart: number) {
  return rows.map((data, idx) =>
    ({
      rowId: idx,
      rowNum: String(idx + rowNumStart).padStart(padRowNum, ' '),
      data: data
    }))
}

export function stateColumns (total: number, colNumStart: number) {
  return new Array(total).fill(undefined)
    .map((_, idx) => {
      return {
        idx: idx,
        idx99: String((idx + colNumStart) % 100).padStart(2, '0'),
        idx100: String(Math.floor((idx + colNumStart) / 100)),
        selected: false,
        header: 0,
        dataEnd: false
      }
    })
}

export function selectColsByHeader (header: Header, cols: StateColumn[]) {
  const colIdx = cols.findIndex(col => col.idx === header.start)
  for (let i = colIdx; i < (header.start + header.length); i += 1) {
    cols[i].selected = true
  }
}

export function clearColumnSelection (cols: StateColumn[]) {
  for (const col of cols) {
    col.selected = false
  }
}

export function createHeaderFromSelected (cols: StateColumn[], headers: Header[]) {
  const start = cols.findIndex(col => col.selected)
  const selected = cols.filter(col => col.selected)
  const length = selected.length

  selected[selected.length - 1].dataEnd = true

  const header: Header = {
    name: 'New Column',
    start,
    length,
    type: {
      byteView: {}
    }
  }
  headers.push(header)
  headers.sort((a, b) => a.start - b.start)

  return header
}

interface RowPartFormat {
  offset: number
  length: number
  selected: boolean
  dataEnd: boolean
}

interface RowPart {
  text: string
  selected: boolean
  dataEnd: boolean
}

export function getRowFormating (columns: StateColumn[]) {
  const fmt: RowPartFormat[] = []

  function colToFmt (col: StateColumn) {
    return {
      offset: col.idx,
      length: col.header || 1,
      selected: col.selected,
      dataEnd: col.dataEnd
    }
  }

  columns = [...columns]
  fmt.push(colToFmt(columns.shift()!))

  columns.reduce((last, curr) => {
    if (
      last.selected === curr.selected &&
      last.dataEnd === false
    ) {
      last.length += 1
      last.dataEnd = curr.dataEnd
    } else {
      last = colToFmt(curr)
      fmt.push(last)
    }
    return last
  }, fmt[0])

  return fmt
}

export function formatRow (row: DataRow, fmt: RowPartFormat[]) {
  return fmt.map(fmt => {
    const slice = Array.from(
      row.subarray(fmt.offset, fmt.offset + fmt.length)
    )
    const hexDump = slice
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ')

    return {
      selected: fmt.selected,
      dataEnd: fmt.dataEnd,
      text: hexDump
    } as RowPart
  })
}
