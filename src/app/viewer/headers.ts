import { StateColumn } from './Viewer'
import { getColumnSelections } from './selection'
import { readCellValue } from '../dat/reader'

export interface Header {
  name: string | null
  readonly offset: number
  readonly length: number
  type: {
    byteView?: { array: boolean }
    ref?: { array: boolean }
    boolean?: {}
    integer?: { unsigned: boolean, size: number }
    decimal?: { size: number }
    string?: {}
    key?: { foreign: boolean }
  }
  cachedView?: Readonly<{
    // stats: [] @TODO
    entriesRaw: Array<ReturnType<typeof readCellValue>>,
    length: number
    entries: Array<[
      string, // value
      number // color
    ]>
  }>
}

export const byteView = (): Header['type'] => ({ byteView: { array: false } })

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
      type: byteView()
    }, {
      name: '',
      offset: selected[0].offset,
      length: selected.length,
      type: byteView()
    }, {
      name: null,
      offset: selected[0].offset + selected.length,
      length: emptyHeader.length - (selected[0].offset - emptyHeader.offset + selected.length),
      type: byteView()
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

export function removeHeader (header: Header, headers: Header[], columns: StateColumn[]) {
  if (header.name == null) {
    throw new Error('Cannot remove empty header')
  }
  if (!header.type.byteView) {
    throw new Error('Cannot remove header in data view mode')
  }

  header.name = null
  header.type = byteView()

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
      type: byteView()
    }
  }

  return false
}
