import { BORDER_WIDTH, CHAR_WIDTH, columnSizes } from '../rendering'
import type { Header } from '../headers'
import type { ColumnStats } from 'pathofexile-dat/dat-analysis'
import type { DatFile } from 'pathofexile-dat'

const BYTE_WIDTH = Math.ceil(CHAR_WIDTH * 3)

interface RenderStat {
  max: string
  array: boolean
  string: boolean
  nullable: boolean
  zero: boolean
}

export interface RenderByte {
  offset: number
  selected: boolean
  border: boolean
  widthPx: number
  leftPx: number
  text: string
  stat?: RenderStat
  key: boolean
}

export function renderByteCols (
  selection: readonly boolean[],
  stats: readonly RenderStat[],
  headers: readonly Header[],
  paintBegin: number,
  paintEnd: number
): RenderByte[] {
  const res: RenderByte[] = []

  let left = 0
  for (const header of headers) {
    const sizes = columnSizes(header)

    if (header.type.byteView && !header.type.byteView.array) {
      let textLeft = left
      for (let i = 0; i < header.length; ++i) {
        const hasBorder = (sizes.hasBorder && i === 0)
        const thisWidth = (CHAR_WIDTH * 3) + (hasBorder ? BORDER_WIDTH : 0)
        if ((Math.ceil(textLeft) + thisWidth) < paintBegin) {
          textLeft += thisWidth
          continue
        }

        const offset = header.offset + i
        res.push({
          offset,
          selected: selection[offset],
          border: hasBorder,
          widthPx: BYTE_WIDTH,
          leftPx: Math.ceil(textLeft),
          text: String(offset % 100).padStart(2, '0'),
          stat: stats[offset],
          key: false
        })

        textLeft += thisWidth
        if (Math.ceil(textLeft) >= paintEnd) return res
      }
    } else if ((left + sizes.borderWidth) >= paintBegin) {
      res.push({
        offset: header.offset,
        selected: false,
        border: sizes.hasBorder,
        widthPx: sizes.paddingWidth,
        leftPx: left,
        text: String(header.offset % 100).padStart(2, '0'),
        key: (header.type.key != null)
      })
    }

    left += sizes.borderWidth
    if (left >= paintEnd) return res
  }

  return res
}

export function renderColStats (stats: ColumnStats[], datFile: DatFile): RenderStat[] {
  const render = stats.map(stat => ({
    max: stat.maxValue.toString(16).padStart(2, '0'),
    array: false,
    string: false,
    nullable: false,
    zero: (stat.maxValue === 0x00)
  }))

  const { fieldSize } = datFile
  for (let idx = 0; idx < stats.length; ++idx) {
    const stat = stats[idx]
    if (stat.refString) {
      for (let k = 0; k < fieldSize.STRING; ++k) {
        render[idx + k].string = true
      }
    }
    if (stat.refArray) {
      for (let k = 0; k < fieldSize.ARRAY; ++k) {
        render[idx + k].array = true
      }
    }
    if (stat.nullableMemsize) {
      for (let k = 0; k < datFile.memsize; ++k) {
        render[idx + k].nullable = true
      }
    }
  }

  return render
}
