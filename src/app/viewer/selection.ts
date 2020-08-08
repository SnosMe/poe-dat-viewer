import { StateColumn } from './Viewer'
import { Header } from './headers'

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

export function clearColumnSelection (columns: StateColumn[]) {
  for (const col of columns) {
    col.selected = false
  }
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
