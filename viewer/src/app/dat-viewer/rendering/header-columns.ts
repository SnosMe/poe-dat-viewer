import type { Header } from '../headers'
import { columnSizes } from '../rendering'

interface RenderHeader {
  offset: number
  border: boolean
  widthPx: number
  leftPx: number
  name: string | null
}

export function renderHeaderCols (
  headers: readonly Header[],
  paintBegin: number,
  paintEnd: number
) {
  const res: RenderHeader[] = []

  let left = 0
  for (const header of headers) {
    const sizes = columnSizes(header)

    if ((left + sizes.borderWidth) >= paintBegin) {
      res.push({
        offset: header.offset,
        border: sizes.hasBorder,
        widthPx: sizes.borderWidth,
        leftPx: left,
        name: header.name
      })
    }

    left += sizes.borderWidth
    if (left >= paintEnd) return res
  }

  return res
}
