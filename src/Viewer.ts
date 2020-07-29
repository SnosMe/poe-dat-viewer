import Vue from 'vue'
import { importDatFile, DatFile } from './dat-file'
import { analyze, ColumnStats } from './analysis'

interface Header {
  name: string | null
  readonly offset: number
  readonly length: number
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
    name: 'Width',
    offset: 12,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Height',
    offset: 16,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Name',
    offset: 20,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'InheritsFrom',
    offset: 24,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'DropLevel',
    offset: 28,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'FlavourTextKey',
    offset: 32,
    length: 8,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Implicit_ModsKeys',
    offset: 40,
    length: 8,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Unknown1',
    offset: 48,
    length: 4,
    type: {
      byteView: {}
    }
  }
]

const ROW_NUM_MIN_LENGTH = 4

export async function importFile () {
  const parsed = await importDatFile('Russian/BaseItemTypes')
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

export function calcRowNumLength (rowCount: number, rowNumStart: number, minLength: number) {
  const maxLen = String(rowCount - 1 + rowNumStart).length
  return Math.max(maxLen, minLength)
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
      if (!col.header || col.header.type.byteView) {
        col.selected = !col.selected
      }
    }
  }
}

export function clearColumnSelection (columns: StateColumn[]) {
  for (const col of columns) {
    col.selected = false
  }
}

function removeHeadersAtOffsets (offsets: number[], headers: Header[], columns: StateColumn[]) {
  for (let idx = 0; idx < headers.length;) {
    const header = headers[idx]
    if (
      header.name != null && offsets.some(offset =>
        offset >= header.offset &&
        offset < header.offset + header.length
      )) {
      removeHeader(header, headers, columns)
    } else {
      idx += 1
    }
  }
}

export function createHeaderFromSelected (columns: StateColumn[], headers: Header[]) {
  const selections = getColumnSelections(columns)
  if (selections.length === 0) {
    throw new Error('No bytes selected')
  } else if (selections.length > 1) {
    throw new Error('Cannot create header from non-contiguous selection')
  }
  const selected = selections[0]

  removeHeadersAtOffsets(selected.map(col => col.offset), headers, columns)

  const emptyHeader = headers.find(header =>
    selected[0].offset >= header.offset &&
    selected[0].offset + selected.length <= header.offset + header.length
  )!

  let updatedHeaders: Header[] = [
    {
      name: null,
      offset: emptyHeader.offset,
      length: selected[0].offset - emptyHeader.offset,
      type: { byteView: {} }
    }, {
      name: '',
      offset: selected[0].offset,
      length: selected.length,
      type: { byteView: {} }
    }, {
      name: null,
      offset: selected[0].offset + selected.length,
      length: emptyHeader.length - (selected[0].offset - emptyHeader.offset + selected.length),
      type: { byteView: {} }
    }
  ]
  const header = updatedHeaders[1]

  updatedHeaders = updatedHeaders.filter(header => header.length)
  headers.splice(headers.indexOf(emptyHeader), 1, ...updatedHeaders)
  for (const col of columns) {
    if (updatedHeaders.some(header => col.offset === header.offset)) {
      col.dataStart = true
    }
  }

  return header
}

interface RowPartFormat {
  offset: number
  length: number
  selected: boolean
  dataStart: boolean
}

interface RowPart {
  text: string
  selected: boolean
  dataStart: boolean
}

export function getRowFormating (columns: StateColumn[]) {
  const fmt: RowPartFormat[] = []

  function colToFmt (col: StateColumn) {
    return {
      offset: col.offset,
      length: 1, // @TODO: col.header?.length
      selected: col.selected,
      dataStart: col.dataStart
    }
  }

  columns = [...columns]
  fmt.push(colToFmt(columns.shift()!))

  columns.reduce((last, curr) => {
    if (
      last.selected === curr.selected &&
      curr.dataStart === false
    ) {
      last.length += 1
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

  return fmt.map<RowPart>(fmt => {
    const slice = Array.from(
      row.subarray(fmt.offset, fmt.offset + fmt.length)
    )
    const hexDump = slice
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ')

    return {
      selected: fmt.selected,
      dataStart: fmt.dataStart,
      text: hexDump
    }
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
  if (header.name == null) {
    throw new Error('Cannot remove empty header')
  }

  if (!header.type.byteView) {
    throw new Error('TODO: toggle byteView first')
  }

  header.name = null
  header.type = {
    byteView: {}
  }

  for (let idx = 0; idx < (headers.length - 1);) {
    const merged = mergeEmptyHeaders(headers[idx], headers[idx + 1])
    if (merged) {
      for (const col of columns) {
        if (col.offset === headers[idx + 1].offset) {
          col.dataStart = false
        }
      }
      headers.splice(idx, 2, merged)
    } else {
      idx += 1
    }
  }
}

function mergeEmptyHeaders (h1: Header, h2: Header): Header | false {
  if (h1.name === null && h2.name === null) {
    return {
      name: null,
      offset: h1.offset,
      length: h1.length + h2.length,
      type: {
        byteView: {}
      }
    }
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
