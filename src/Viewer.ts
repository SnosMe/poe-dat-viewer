import Vue from 'vue'
import { importDatFile, DatFile } from './dat-file'

interface Header {
  name: string | null
  offset: number
  length: number
  type: {
    byteView?: {}
    ref?: { array: boolean }
    boolean?: {}
    integer?: { unsigned: boolean, nullable: boolean, size: number }
    decimal?: { size: number }
    string?: {}
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

export const state = Vue.observable({
  headers: [] as Header[],
  columns: [] as StateColumn[],
  datFile: null as DatFile | null,
  rowIndexing: 0,
  colIndexing: 0,
  rowNumberLength: -1,
  editHeader: null as Header | null,
  config: {
    rowNumStart: 0,
    colNumStart: 0
  }
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

export async function importFile () {
  const parsed = await importDatFile('BaseItemTypes')
  const rowNumLen = calcRowNumLength(parsed.rowCount, state.config.rowNumStart, ROW_NUM_MIN_LENGTH)

  state.datFile = parsed
  state.columns = stateColumns(parsed.rowLength, state.config.colNumStart)

  for (const importedHeader of IMPORT_HDRS) {
    selectColsByHeader(importedHeader, state.columns)
    const header = createHeaderFromSelected(state.columns, state.headers)
    header.name = importedHeader.name
    clearColumnSelection(state.columns)
  }

  state.rowNumberLength = rowNumLen
}

export function calcRowNumLength (rowCount: number, rowNumStart: number, minLength: number) {
  const maxLen = String(rowCount - 1 + rowNumStart).length
  return Math.max(maxLen, minLength)
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

export function formatRow (rowIdx: number, fmt: RowPartFormat[], datFile: DatFile) {
  const row = datFile.dataFixed.subarray(
    rowIdx * datFile.rowLength,
    rowIdx * datFile.rowLength + datFile.rowLength
  )

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

export function isHeaderTypeUnknown (header: Header) {
  return !(
    header.type.ref ||
    header.type.boolean ||
    header.type.integer ||
    header.type.decimal ||
    header.type.string
  )
}

export function headerToPogoFieldFormat (header: Header, unknownNum: number, undefinedNum: number) {
  let fields: Array<[string, string]>

  const type = getPogoFieldType(header)
  if (typeof type === 'string') {
    fields = [
      [header.name! || `Unknown${++unknownNum}`, type]
    ]
  } else {
    fields = new Array(header.length).fill(undefined).map(_ =>
      [`Undefined${++undefinedNum}`, type.byte]
    )
  }

  return { unknownNum, undefinedNum, fields }
}

function getPogoFieldType (header: Header) {
  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.ref?.array
  const size = integer?.size || decimal?.size || header.length

  if (integer) {
    if (size === 1 && integer.unsigned && !integer.nullable && !array) return 'uint8'
    if (size === 2 && integer.unsigned && !integer.nullable && !array) return 'uint16'
    if (size === 4 && integer.unsigned && !integer.nullable && !array) return 'uint32'
    if (size === 8 && integer.unsigned && !integer.nullable && !array) return 'uint64'

    if (size === 4 && !integer.unsigned && !integer.nullable && !array) return 'int32'
    if (size === 8 && !integer.unsigned && !integer.nullable && !array) return 'int64'

    if (size === 1 && integer.unsigned && !integer.nullable && array) return '[]uint8'
    if (size === 2 && integer.unsigned && !integer.nullable && array) return '[]uint16'
    if (size === 4 && integer.unsigned && !integer.nullable && array) return '[]uint32'
    if (size === 8 && integer.unsigned && !integer.nullable && array) return '[]uint64'

    if (size === 4 && !integer.unsigned && !integer.nullable && array) return '[]int32'
    if (size === 8 && !integer.unsigned && !integer.nullable && array) return '[]int64'

    if (size === 4 && !integer.unsigned && integer.nullable && !array) return '*int32'
    if (size === 8 && !integer.unsigned && integer.nullable && !array) return '*int64'
  }

  if (decimal) {
    if (size === 4 && !array) return 'float32'
    if (size === 8 && !array) return 'float64'

    if (size === 4 && array) return '[]float32'
    if (size === 8 && array) return '[]float64'
  }

  if (boolean) {
    return array ? '[]bool' : 'bool'
  }

  if (string) {
    return array ? '[]string' : 'string'
  }

  return { byte: 'uint8' }
}
