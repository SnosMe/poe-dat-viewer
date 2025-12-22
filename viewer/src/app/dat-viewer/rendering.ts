import type { Header } from './headers.js'
import type { RenderByte } from './rendering/byte-columns.js'
import type { Viewer } from './Viewer.js'
import { renderCellContent, drawByteView, drawArrayVarData } from './rendering/content.js'

export const FONT_FAMILY = 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
export const FONT_SIZE = 14
export const CHAR_WIDTH = getMonoFontWidth(FONT_SIZE, FONT_FAMILY)
export const XBASE_HEIGHT = getFontBaseLine(FONT_SIZE, FONT_FAMILY)
export const LINE_HEIGHT = 19
export const ROWNUM_MIN_LENGTH = 3
export const BORDER_WIDTH = 1
export const COLUMN_STAT_HEIGHT = 7
export const COLUMN_BYTE_HEIGHT = Math.round(CHAR_WIDTH * 3)
export const HEADERS_HEIGHT = COLUMN_BYTE_HEIGHT * 2 + COLUMN_STAT_HEIGHT * 3

export interface CanvasPalette {
  background: string
  text: string
  selectedRow: string
  selectedColumn: string
  columnBorder: string
  shadowTop: [string, string]
  shadowLeft: [string, string]
  typeColors: {
    numeric: string
    string: string
    nullish: string
  }
}

export const canvasPalettes: Record<'light' | 'dark', CanvasPalette> = {
  light: {
    background: '#ffffff',
    text: '#1f2933',
    selectedRow: 'rgba(148, 197, 255, 0.55)',
    selectedColumn: 'rgba(148, 197, 255, 0.55)',
    columnBorder: '#cbd5e1',
    shadowTop: ['rgba(248, 250, 252, 0.7)', 'rgba(248, 250, 252, 0)'],
    shadowLeft: ['rgba(248, 250, 252, 0.5)', 'rgba(248, 250, 252, 0)'],
    typeColors: {
      numeric: '#065f46',
      string: '#1d4ed8',
      nullish: '#0e7490'
    }
  },
  dark: {
    background: '#161b22',
    text: '#f3f4f6',
    selectedRow: 'rgba(96, 165, 250, 0.35)',
    selectedColumn: 'rgba(96, 165, 250, 0.35)',
    columnBorder: '#2d3645',
    shadowTop: ['rgba(22, 27, 34, 0.7)', 'rgba(22, 27, 34, 0)'],
    shadowLeft: ['rgba(22, 27, 34, 0.5)', 'rgba(22, 27, 34, 0)'],
    typeColors: {
      numeric: '#34d399',
      string: '#93c5fd',
      nullish: '#38bdf8'
    }
  }
}

// console.log(getBaseLine(14), 'CR: 11  |  FF: 12')
// console.log(getBaseLine(18), 'CR: 13  |  FF: 14')
// console.log(getBaseLine(19), 'CR: 14  |  FF: 14')
// console.log(getBaseLine(20), 'CR: 14  |  FF: 15')

export function rowNumLength (rowCount: number) {
  const maxLen = String(rowCount - 1).length
  return Math.max(maxLen, ROWNUM_MIN_LENGTH)
}

export function rowsNumWidth (rowCount: number) {
  return Math.ceil(rowNumLength(rowCount) * CHAR_WIDTH)
}

export function rowsOverlayWidth (rowCount: number) {
  return rowsNumWidth(rowCount) + (8 * 2)
}

function getMonoFontWidth (fontSize: number, fontFamily: string): number {
  const canvasEl = document.createElement('canvas')
  const context = canvasEl.getContext('2d')!
  context.font = `${fontSize}px ${fontFamily}`
  const metrics = context.measureText('0')
  return metrics.width
}

function getFontBaseLine (fontSize: number, fontFamily: string): number {
  const canvasEl = document.createElement('canvas')
  const context = canvasEl.getContext('2d')!
  context.font = `${fontSize}px ${fontFamily}`
  context.textBaseline = 'middle'
  const metrics = context.measureText('0')
  const xBase = (fontSize / 2) +
    ((metrics.alphabeticBaseline !== undefined)
      ? -metrics.alphabeticBaseline
      : metrics.actualBoundingBoxDescent)

  return xBase
}

export function getBaseLine (lineHeight: number): number {
  return /* Math.round */ (1 + (lineHeight - FONT_SIZE) / 2 + XBASE_HEIGHT)
}

export function drawRows (params: {
  left: number
  paintWidth: number
  top: number
  rows: number[]
  columns: RenderByte[]
  viewer: Viewer
  ctx: CanvasRenderingContext2D
  palette: CanvasPalette
}) {
  const { ctx, palette } = params

  ctx.fillStyle = palette.background
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // draw selected row
  if (params.viewer.selectedRow.value !== null) {
    const selectedIdx = params.rows.indexOf(params.viewer.selectedRow.value)
    if (selectedIdx !== -1) {
      ctx.fillStyle = palette.selectedRow
      ctx.fillRect(
        0, params.top + (selectedIdx * LINE_HEIGHT),
        ctx.canvas.width, LINE_HEIGHT
      )
    }
  }

  // drawColumns
  ctx.save()
  ctx.translate(-params.left, 0)
  drawColumns(ctx, params.columns, palette)
  ctx.restore()

  // draw content
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`
  ctx.fillStyle = palette.text

  const renderers = getColumnRenderers(params.viewer, params.left, params.left + params.paintWidth)

  for (const render of renderers) {
    ctx.save()
    ctx.beginPath()
    ctx.translate(render.left - params.left, 0)
    ctx.rect(0, 0, render.width, ctx.canvas.height)
    ctx.clip()
    ctx.translate(CHAR_WIDTH / 2, params.top + getBaseLine(LINE_HEIGHT))
    render.exec(ctx, params.rows, palette)
    ctx.restore()
  }

  // draw inset shadow
  {
    const grdH = ctx.createLinearGradient(0, -16, 0, 4)
    grdH.addColorStop(0, palette.shadowTop[0])
    grdH.addColorStop(1, palette.shadowTop[1])
    ctx.fillStyle = grdH
    ctx.fillRect(0, 0, ctx.canvas.width, 6)

    const grdV = ctx.createLinearGradient(-16, 0, 4, 0)
    grdV.addColorStop(0, palette.shadowLeft[0])
    grdV.addColorStop(1, palette.shadowLeft[1])
    ctx.fillStyle = grdV
    ctx.fillRect(0, 0, 6, ctx.canvas.height)
  }
}

function drawColumns (ctx: CanvasRenderingContext2D, columns: readonly RenderByte[], palette: CanvasPalette) {
  for (const col of columns) {
    if (col.selected) {
      ctx.fillStyle = palette.selectedColumn
      ctx.fillRect(
        col.leftPx + (col.border ? BORDER_WIDTH : 0), 0,
        col.widthPx, ctx.canvas.height
      )
    }
    if (col.border) {
      ctx.fillStyle = palette.columnBorder
      ctx.fillRect(
        col.leftPx, 0,
        BORDER_WIDTH, ctx.canvas.height
      )
    }
  }
}

type DrawColumnContentFn = (ctx: CanvasRenderingContext2D, rows: number[], palette: CanvasPalette) => void
interface ColumnContentRenderer {
  left: number
  width: number
  exec: DrawColumnContentFn
}

export function getColumnRenderers (viewer: Viewer, paintBegin: number, paintEnd: number): ColumnContentRenderer[] {
  const headers = viewer.headers.value
  const stats = viewer.columnStats.value
  const datFile = viewer.datFile

  const res: ColumnContentRenderer[] = []
  let left = 0
  for (const header of headers) {
    const sizes = columnSizes(header)

    if ((left + sizes.borderWidth) >= paintBegin) {
      if (header.type.byteView) {
        if (header.type.byteView.array) {
          res.push({
            left: left + (sizes.borderWidth ? BORDER_WIDTH : 0),
            width: sizes.paddingWidth,
            exec: (ctx: CanvasRenderingContext2D, rows: number[], palette: CanvasPalette) => {
              drawArrayVarData(ctx, header, datFile, rows, stats[header.offset], palette)
            }
          })
        } else {
          const hexBegin = Math.max(0, Math.floor((paintBegin - left) / (CHAR_WIDTH * 3)))
          const hexEnd = Math.min(header.length, Math.ceil((paintEnd - left) / (CHAR_WIDTH * 3)))
          res.push({
            left: left + (sizes.borderWidth ? BORDER_WIDTH : 0),
            width: sizes.paddingWidth,
            exec: (ctx: CanvasRenderingContext2D, rows: number[], palette: CanvasPalette) => {
              drawByteView(ctx, header, datFile, rows, hexBegin, hexEnd, palette)
            }
          })
        }
      } else {
        res.push({
          left: left + (sizes.borderWidth ? BORDER_WIDTH : 0),
          width: sizes.paddingWidth,
            exec: (ctx: CanvasRenderingContext2D, rows: number[], palette: CanvasPalette) => {
              if (header.type.key?.table && header.type.key.viewColumn) {
                const referenced = viewer.referencedTables.value.get(header.type.key.table)!.value
                if (referenced) {
                  const referencedHeader = referenced.headers.find(h => h.name === header.type.key!.viewColumn)
                  if (referencedHeader) {
                    renderCellContent(ctx, header, datFile, rows, palette, { header: referencedHeader, datFile: referenced.datFile })
                    return
                  }
                }
              }
              renderCellContent(ctx, header, datFile, rows, palette)
            }
          })
        }
      }

    left += sizes.borderWidth
    if (left >= paintEnd) return res
  }

  return res
}

export function columnSizes (header: Readonly<Header>) {
  const textLength = (header.type.byteView && !header.type.byteView.array)
    ? header.length * 3 - 1
    : header.textLength!
  return {
    paddingWidth: Math.ceil((textLength + 1) * CHAR_WIDTH),
    borderWidth: Math.ceil((textLength + 1) * CHAR_WIDTH) + (header.offset > 0 ? BORDER_WIDTH : 0),
    hasBorder: header.offset > 0
  }
}

export function getRowWidth (headers: readonly Header[]): number {
  let size = 0
  for (const header of headers) {
    const sizes = columnSizes(header)
    size += sizes.borderWidth
  }
  return size
}
