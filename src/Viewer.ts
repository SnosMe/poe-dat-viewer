import Vue from 'vue'
import { parse } from './file'

interface Header {
  name: string | null
  offset: number
  length: number
  type: {
    byteView?: {}
    refArray?: {}
    boolean?: {}
    integer?: { unsigned: boolean, nullable: boolean }
    decimal?: {}
    refString?: {}
  }
}

interface StateColumn {
  offset: number
  colNum99: string
  colNum100: string
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
  rowNumberLength: -1,
  editHeader: null
})

const IMPORT_HDRS: Header[] = [
  {
    name: 'Id',
    offset: 0,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'ItemClassesKey',
    offset: 4,
    length: 8,
    type: {
      byteView: {}
    }
  },
  {
    name: null,
    offset: 12,
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
    .map((_, idx) => ({
      offset: idx,
      colNum99: String((idx + colNumStart) % 100).padStart(2, '0'),
      // colNum100: String(Math.floor((idx + colNumStart) / 100)),
      colNum100: String(idx + colNumStart).padStart(2, '0'),
      selected: false,
      header: 0,
      dataEnd: false
    } as StateColumn))
}

export function selectColsByHeader (header: Header, cols: StateColumn[]) {
  const colIdx = cols.findIndex(col => col.offset === header.offset)
  for (let i = colIdx; i < (header.offset + header.length); i += 1) {
    cols[i].selected = true
  }
}

export function toggleColsBetween (cols: StateColumn[], a: number, b: number) {
  const start = Math.min(a, b)
  const end = Math.max(a, b)

  for (const col of cols) {
    if (col.offset >= start && col.offset <= end) {
      if (!col.header) {
        col.selected = !col.selected
      }
    }
  }
}

export function clearColumnSelection (cols: StateColumn[]) {
  for (const col of cols) {
    col.selected = false
  }
}

export function createHeaderFromSelected (cols: StateColumn[], headers: Header[]) {
  const offset = cols.find(col => col.selected)!.offset
  const selected = cols.filter(col => col.selected)
  const length = selected.length

  selected[selected.length - 1].dataEnd = true

  const header: Header = {
    name: 'New Column',
    offset,
    length,
    type: {
      byteView: {}
    }
  }
  headers.push(header)
  headers.sort((a, b) => a.offset - b.offset)

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
      offset: col.offset,
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

export function getColumnSelections (columns: readonly StateColumn[]) {
  const ranges: StateColumn[][] = []

  let idx = columns.findIndex(col => col.selected)
  let last: StateColumn
  if (idx < 0) {
    return ranges
  } else {
    last = columns[idx]
    ranges.push([last])
  }

  for (idx += 1; idx < columns.length; idx += 1) {
    if (columns[idx].selected) {
      const curr = columns[idx]
      if ((curr.offset - last.offset) === 1) {
        ranges[ranges.length - 1].push(curr)
      } else {
        ranges.push([curr])
      }
      last = curr
    }
  }

  return ranges
}

export function removeHeader (header: Header, headers: Header[], columns: StateColumn[]) {
  if (!header.type.byteView) {
    throw new Error('TODO: toggle byteView first')
  }

  header.name = null
  header.type = {
    byteView: {}
  }

  for (let idx = 0; idx < (headers.length - 1); idx += 1) {
    const merged = mergeHeaders(headers[idx], headers[idx + 1])
    if (merged) {
      for (const col of columns) {
        if (col.offset === (headers[idx].offset + headers[idx].length - 1)) {
          col.dataEnd = false
        }
      }
      headers.splice(idx, 2, merged)
    }
  }
}

function mergeHeaders (h1: Header, h2: Header) {
  if (h1.name === null && h2.name === null) {
    return {
      name: null,
      offset: h1.offset,
      length: h1.length + h2.length,
      type: {
        byteView: {}
      }
    } as Header
  }

  return false
}
