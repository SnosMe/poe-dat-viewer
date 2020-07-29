import { StateColumn } from './Viewer'
import { DatFile } from '../dat/dat-file'

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

export function calcRowNumLength (rowCount: number, rowNumStart: number, minLength: number) {
  const maxLen = String(rowCount - 1 + rowNumStart).length
  return Math.max(maxLen, minLength)
}
