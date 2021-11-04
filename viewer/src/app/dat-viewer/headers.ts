import { DatFile, getHeaderLength } from 'pathofexile-dat'
import { ColumnStats, validateHeader } from 'pathofexile-dat/dat-analysis'
import { getColumnSelections } from './selection'
import type { ViewerSerializedHeader } from './db'

export interface Header {
  name: string | null
  readonly offset: number
  readonly length: number
  type: {
    byteView?: { array: boolean }
    array?: boolean
    boolean?: { [key: string]: never }
    integer?: { unsigned: boolean, size: number }
    decimal?: { size: number }
    string?: { [key: string]: never }
    key?: { foreign: boolean, table: string | null, viewColumn: string | null }
  }
  textLength?: number
}

export const byteView = (): Header['type'] => ({ byteView: { array: false } })

function removeHeadersAtOffsets (offsets: number[], headers: Header[]) {
  for (let idx = 0; idx < headers.length;) {
    const header = headers[idx]
    if (
      header.name != null && offsets.some(offset =>
        offset >= header.offset &&
        offset < header.offset + header.length
      )) {
      removeHeader(header, headers)
    } else {
      idx += 1
    }
  }
}

export function createHeaderFromSelected (selection: boolean[], headers: Header[]) {
  const selections = getColumnSelections(selection)
  if (selections.length === 0) {
    throw new Error('No bytes selected')
  } else if (selections.length > 1) {
    throw new Error('Cannot create header from non-contiguous selection')
  }
  const selected = selections[0]

  removeHeadersAtOffsets(selected, headers)

  const emptyHeader = headers.find(header =>
    selected[0] >= header.offset &&
    selected[0] + selected.length <= header.offset + header.length
  )!

  let updatedHeaders: Header[] = [
    {
      name: null,
      offset: emptyHeader.offset,
      length: selected[0] - emptyHeader.offset,
      type: byteView()
    }, {
      name: '',
      offset: selected[0],
      length: selected.length,
      type: byteView(),
      textLength: 4 * 3 - 1
    }, {
      name: null,
      offset: selected[0] + selected.length,
      length: emptyHeader.length - (selected[0] - emptyHeader.offset + selected.length),
      type: byteView()
    }
  ]
  const header = updatedHeaders[1]

  updatedHeaders = updatedHeaders.filter(header => header.length)
  headers.splice(headers.indexOf(emptyHeader), 1, ...updatedHeaders)

  return header
}

export function removeHeader (header: Header, headers: Header[]) {
  if (header.name == null) {
    throw new Error('Cannot remove empty header')
  }

  header.name = null
  header.type = byteView()

  for (let idx = 0; idx < (headers.length - 1);) {
    const merged = mergeEmptyHeaders(headers[idx], headers[idx + 1])
    if (merged) {
      headers.splice(idx, 2, merged)
    } else {
      idx += 1
    }
  }
}

function mergeEmptyHeaders (h1: Header, h2: Header): Header | null {
  if (h1.name === null && h2.name === null) {
    return {
      name: null,
      offset: h1.offset,
      length: h1.length + h2.length,
      type: byteView()
    }
  }

  return null
}

export function fromSerializedHeaders (
  serialized: ViewerSerializedHeader[],
  columnStats: ColumnStats[],
  datFile: DatFile
) {
  const out: Header[] = []
  let offset = 0
  for (const hdrSerialized of serialized) {
    if (hdrSerialized.name == null || hdrSerialized.length) {
      return null
    }
    const headerLength = getHeaderLength(hdrSerialized, datFile)
    const header: Header = {
      ...hdrSerialized,
      length: headerLength,
      offset: offset
    }
    const isValid = validateHeader(header, columnStats)
    if (!isValid) {
      return null
    } else {
      out.push(header)
      offset += headerLength
    }
  }
  return {
    headers: out,
    increasedRowLength: (offset < datFile.rowLength)
  }
}
