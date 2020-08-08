import { StateColumn } from './Viewer'
import { DatFile } from '../dat/dat-file'
import { Header } from './headers'
import { readCellValue } from '../dat/reader'

interface RowPartFormat {
  offset: number
  length: number
  selected: boolean
  dataStart: boolean
  cachedView: Header['cachedView'] | null
}

interface RowPart {
  text: string
  selected: boolean
  dataStart: boolean
  color: number
  width: number
}

export function getRowFormating (columns: StateColumn[]) {
  const fmt: RowPartFormat[] = []

  function colToFmt (col: StateColumn) {
    return {
      offset: col.offset,
      length: 1,
      selected: col.selected,
      dataStart: col.dataStart,
      cachedView: (col.header && !col.header.type.byteView) ? col.header.cachedView : null
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
    if (fmt.cachedView) {
      return {
        selected: false,
        dataStart: true,
        text: fmt.cachedView.entries[rowIdx][0],
        color: fmt.cachedView.entries[rowIdx][1],
        width: fmt.cachedView.length
      }
    } else {
      const slice = Array.from(
        row.subarray(fmt.offset, fmt.offset + fmt.length)
      )
      const hexDump = slice
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ')

      return {
        selected: fmt.selected,
        dataStart: fmt.dataStart,
        text: hexDump,
        color: 0,
        width: hexDump.length
      }
    }
  })
}

export function calcRowNumLength (rowCount: number, rowNumStart: number, minLength: number) {
  const maxLen = String(rowCount - 1 + rowNumStart).length
  return Math.max(maxLen, minLength)
}

export function cacheHeaderDataView (header: Header, datFile: DatFile) {
  // NOTE: length of the string is in UTF-16 code units, not code points!
  let length = 0

  const entries = Array(datFile.rowCount).fill(undefined).map<[string, number]>((_, rowIdx) => {
    const value = readCellValue((rowIdx * datFile.rowLength) + header.offset, header, datFile)

    let text = ''
    let color = 0

    if (Array.isArray(value)) {
      if (header.type.boolean) {
        text = `[${value.join(', ')}]`
        color = 3
      } else if (header.type.string) {
        text = `[${value.map(_ => '"' + _ + '"').join(', ')}]`
        color = 1
      } else if (header.type.integer || header.type.decimal) {
        text = `[${value.join(', ')}]`
        color = 2
      }
    } else {
      if (header.type.boolean) {
        text = String(value)
        color = 3
      } else if (header.type.string) {
        if (value === '') {
          text = 'null'
          color = 3
        } else {
          text = String(value)
          color = 1
        }
      } else if (header.type.integer || header.type.decimal) {
        if (value === null) {
          text = 'null'
          color = 3
        } else {
          text = String(value)
          color = 2
        }
      }
    }

    length = Math.max(length, text.length)

    return [text, color]
  })

  if (header.type.ref?.array || header.type.string) {
    length = medianEntriesLength(entries)
  }
  length = Math.max(length, (header.length * 3 - 1))

  header.cachedView = Object.freeze({
    length,
    entries
  })
}

function medianEntriesLength (entries: Array<[string, number]>) {
  const arr = entries.map(_ => _[0].length)
  arr.sort((a, b) => a - b)
  const mid = Math.floor(arr.length / 2)
  return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
}
