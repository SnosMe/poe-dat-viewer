import { DatFile, readDatFile, readColumn } from 'pathofexile-dat'
import type { ColumnStats } from 'pathofexile-dat/dat-analysis'
import { validateHeader } from 'pathofexile-dat/dat-analysis/validation'
import { getHeaderLength } from 'pathofexile-dat/dat/header'
import { Header, createHeaderFromSelected, byteView } from './headers'
import * as db from './db'
import { clearColumnSelection, selectColsByHeader } from './selection'
import { shallowRef, Ref, triggerRef, shallowReactive } from 'vue'
import { analyzeDatFile } from '../worker/interface'

export interface Viewer {
  readonly name: string
  readonly datFile: DatFile
  headers: Ref<Header[]>
  columnStats: Ref<ColumnStats[]>
  columnSelection: Ref<boolean[]>
  editHeader: Ref<Header | null>
  selectedRow: Ref<number | null>
  rowSorting: Ref<number[] | null>
  scrollPos: { x: number, y: number }
}

export function createViewer (path: string, fileContent: Uint8Array): Viewer {
  const parsed = readDatFile(path, fileContent)

  const viewer: Viewer = {
    headers: shallowRef(
      parsed.rowLength
        ? [{
          name: null,
          offset: 0,
          length: parsed.rowLength,
          type: byteView()
        }] : []
    ),
    datFile: parsed,
    name: getNamePart(path),
    columnStats: shallowRef([]),
    columnSelection: shallowRef(new Array(parsed.rowLength).fill(false)),
    editHeader: shallowRef(null),
    selectedRow: shallowRef(null),
    rowSorting: shallowRef(null),
    scrollPos: shallowReactive({ x: 0, y: 0 })
  }

  analyzeDatFile(viewer.datFile).then(async stats => {
    viewer.columnStats.value = stats

    const headers = await db.findByName(viewer.name)
    try {
      tryImportHeaders(headers, viewer)
    } catch (e) {
      window.alert(`WARN: ${e.message}`)
    } finally {
      triggerRef(viewer.headers)
    }
  })

  return viewer
}

function tryImportHeaders (serialized: db.ViewerSerializedHeader[], viewer: Viewer) {
  let offset = 0
  for (const hdrSerialized of serialized) {
    const headerLength = hdrSerialized.length || getHeaderLength(hdrSerialized, viewer.datFile)
    if (hdrSerialized.name == null) {
      offset += headerLength
      continue
    }

    const header: Header = {
      ...hdrSerialized,
      length: headerLength,
      offset: offset
    }

    const isValid = (hdrSerialized.length)
      ? (viewer.datFile.rowLength - header.offset) >= header.length
      : validateHeader(header, viewer.columnStats.value, viewer.datFile)
    if (!isValid) {
      throw new Error('The schema is invalid.')
    }

    selectColsByHeader(header, viewer.columnSelection.value)
    const headerCreated = createHeaderFromSelected(viewer.columnSelection.value, viewer.headers.value)
    Object.assign(headerCreated, header)
    clearColumnSelection(viewer.columnSelection.value)

    offset += headerLength
  }
}

export function exportAllRows (headers: Header[], datFile: DatFile) {
  const columns = headers
    .filter(({ type }) => type.boolean || type.decimal || type.integer || type.key || type.string)
    .map((header, idx) => ({
      name: header.name || `Unknown${idx + 1}`,
      data: (() => {
        const data = readColumn(header, datFile)

        if (header.type.key?.foreign) {
          if (!header.type.array) {
            const data_ = data as ({ rid: number, unknown: number } | null)[]
            if (!data_.every(row => row == null || row.unknown === 0)) {
              throw new Error('never')
            }
            return data_.map(row => row && row.rid)
          } else {
            const data_ = data as (Array<{ rid: number, unknown: number }>)[]
            if (!data_.every(row => row.every(entry => entry.unknown === 0))) {
              throw new Error('never')
            }
            return data_.map(row => row.map(entry => entry.rid))
          }
        }

        return data
      })()
    }))

  columns.unshift({
    name: '_rid',
    data: Array(datFile.rowCount).fill(undefined)
      .map((_, idx) => idx)
  })

  return Array(datFile.rowCount).fill(undefined)
    .map((_, idx) => Object.fromEntries(
      columns.map(col => [col.name, col.data[idx]])
    ))
}

function getNamePart (path: string) {
  return path.match(/[^/]+(?=\..+$)/)![0]
}

export function saveHeaders (viewer: Viewer) {
  db.saveHeaders(viewer.name, viewer.headers.value)
}
