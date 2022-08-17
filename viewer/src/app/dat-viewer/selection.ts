import type { Header } from './headers.js'

export function selectColsByHeader (header: Header, selection: boolean[]) {
  for (let offset = header.offset; offset < (header.offset + header.length); ++offset) {
    selection[offset] = true
  }
}

export function toggleColsBetween (selection: boolean[], a: number, b: number, headers: readonly Header[]) {
  const start = Math.min(a, b)
  const end = Math.max(a, b)

  headers = headers.filter(hdr => (hdr.type.byteView && !hdr.type.byteView.array))

  for (let offset = start; offset <= end; ++offset) {
    if (headers.some(hdr =>
      offset >= hdr.offset && offset < (hdr.offset + hdr.length)
    )) {
      selection[offset] = !selection[offset]
    }
  }
}

export function clearColumnSelection (selection: boolean[]) {
  selection.fill(false)
}

export function getColumnSelections (selection: readonly boolean[]) {
  const ranges: number[][] = []

  let idx = selection.indexOf(true)
  let last: number
  if (idx < 0) {
    return ranges
  } else {
    last = idx
    ranges.push([last])
  }

  for (idx += 1; idx < selection.length; ++idx) {
    if (selection[idx]) {
      const curr = idx
      if ((curr - last) === 1) {
        ranges[ranges.length - 1].push(curr)
      } else {
        ranges.push([curr])
      }
      last = curr
    }
  }

  return ranges
}
