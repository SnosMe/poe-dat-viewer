import { CHAR_WIDTH, LINE_HEIGHT, type CanvasPalette } from '../rendering.js'
import { type DatFile, type Header as DatHeader, type ColumnStats, getFieldReader } from 'pathofexile-dat/dat.js'
import type { Header as HeaderViewer } from '../headers.js'

interface StringifyOut {
  text: string
  color: string
}

function integerToString (value: number, out: StringifyOut, palette: CanvasPalette) {
  out.text = String(value)
  out.color = palette.typeColors.numeric
}
function decimalToString (value: number, out: StringifyOut, palette: CanvasPalette) {
  out.text = value.toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 1 })
  out.color = palette.typeColors.numeric
}
function integerArrayToString (value: number[], out: StringifyOut, palette: CanvasPalette) {
  out.text = `[${value.join(', ')}]`
  out.color = palette.typeColors.numeric
}
function decimalArrayToString (value: number[], out: StringifyOut, palette: CanvasPalette) {
  out.text = `[${value.map(value => value.toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 1 })).join(', ')}]`
  out.color = palette.typeColors.numeric
}
function booleanToString (value: boolean, out: StringifyOut, palette: CanvasPalette) {
  out.text = String(value)
  out.color = palette.typeColors.nullish
}
function booleanArrayToString (value: boolean[], out: StringifyOut, palette: CanvasPalette) {
  out.text = `[${value.join(', ')}]`
  out.color = palette.typeColors.nullish
}
function stringToString (value: string, out: StringifyOut, palette: CanvasPalette) {
  if (value === '') {
    out.text = 'empty'
    out.color = palette.typeColors.nullish
  } else {
    out.text = String(value)
    out.color = palette.typeColors.string
  }
}
function stringArrayToString (value: string[], out: StringifyOut, palette: CanvasPalette) {
  out.text = `[${value.map(str => JSON.stringify(str)).join(', ')}]`
  out.color = palette.typeColors.string
}
function keySelfToString (value: number | null, out: StringifyOut, palette: CanvasPalette) {
  if (value === null) {
    out.text = '<null, self>'
    out.color = palette.typeColors.nullish
  } else {
    out.text = `<${value}, self>`
    out.color = palette.typeColors.numeric
  }
}
function keySelfArrayToString (value: number[], out: StringifyOut, palette: CanvasPalette) {
  out.text = `[${value.map(key => `<${key}, self>`).join(', ')}]`
  out.color = palette.typeColors.numeric
}
function keyForeignToString (value: number | null, out: StringifyOut, palette: CanvasPalette) {
  if (value === null) {
    out.text = '<null>'
    out.color = palette.typeColors.nullish
  } else {
    out.text = `<${value}>`
    out.color = palette.typeColors.numeric
  }
}
function keyForeignArrayToString (value: number[], out: StringifyOut, palette: CanvasPalette) {
  out.text = `[${value.map(key => `<${key}>`).join(', ')}]`
  out.color = palette.typeColors.numeric
}

export function renderCellContent (
  ctx: CanvasRenderingContext2D,
  header: DatHeader,
  datFile: DatFile,
  rows: number[],
  palette: CanvasPalette,
  referenced?: { header: DatHeader, datFile: DatFile }
) {
  const read = getFieldReader(header, datFile)

  if (referenced?.header.type.array) {
    throw new Error('Can\'t show array of arrays.')
  }
  type ReadReferencedReturn = (rowIdx: number) => Exclude<ReturnType<ReturnType<typeof getFieldReader>>, unknown[]>
  const readReferenced = referenced && getFieldReader(referenced.header, referenced.datFile) as ReadReferencedReturn

  const draw: StringifyOut = { text: '', color: '' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stringify: (value: any, out: StringifyOut, palette: CanvasPalette) => void = (() => {
    const type = (referenced != null) ? referenced.header.type : header.type
    if (header.type.array) {
      if (type.boolean) return booleanArrayToString
      if (type.string) return stringArrayToString
      if (type.integer) return integerArrayToString
      if (type.decimal) return decimalArrayToString
      if (type.key?.foreign) return keyForeignArrayToString
      if (type.key) return keySelfArrayToString
    } else {
      if (type.boolean) return booleanToString
      if (type.string) return stringToString
      if (type.integer) return integerToString
      if (type.decimal) return decimalToString
      if (type.key?.foreign) return keyForeignToString
      if (type.key) return keySelfToString
    }
    throw new Error('never')
  })()

  let textY = 0
  let prevColor = ''
  for (const rid of rows) {
    let cellData = read(rid)
    if (referenced) {
      if (header.type.array) {
        cellData = (cellData as number[]).map(rRid => readReferenced!(rRid))
        stringify(cellData, draw, palette)
      } else {
        if (cellData === null) {
          const stringify = (header.type.key!.foreign) ? keyForeignToString : keySelfToString
          stringify(cellData, draw, palette)
        } else {
          cellData = readReferenced!(cellData as number)
          stringify(cellData, draw, palette)
        }
      }
    } else {
      stringify(cellData, draw, palette)
    }

    if (prevColor !== draw.color) {
      ctx.fillStyle = draw.color
      prevColor = draw.color
    }
    ctx.fillText(draw.text, 0, textY)
    textY += LINE_HEIGHT
  }
}

export function drawByteView (
  ctx: CanvasRenderingContext2D,
  header: DatHeader,
  datFile: DatFile,
  rows: number[],
  begin: number,
  end: number,
  palette: CanvasPalette
) {
  ctx.fillStyle = palette.text

  let textY = 0
  for (const rowIdx of rows) {
    const data = datFile.dataFixed.subarray(
      (rowIdx * datFile.rowLength) + header.offset + begin,
      (rowIdx * datFile.rowLength) + header.offset + end
    )
    const hexDump = Array.from(data, byte =>
      byte.toString(16).padStart(2, '0')
    ).join(' ')

    ctx.fillText(hexDump, begin * (CHAR_WIDTH * 3), textY)
    textY += LINE_HEIGHT
  }
}

export function drawArrayVarData (
  ctx: CanvasRenderingContext2D,
  header: HeaderViewer,
  datFile: DatFile,
  rows: number[],
  stats: ColumnStats,
  palette: CanvasPalette
) {
  ctx.fillStyle = palette.text

  const stat = stats.refArray as Exclude<typeof stats['refArray'], false>
  const entryMaxLength = Math.max(...([
    (stat.keyForeign ? datFile.fieldSize.KEY_FOREIGN : 0),
    (stat.keySelf ? datFile.fieldSize.KEY : 0),
    (stat.string ? datFile.fieldSize.STRING : 0),
    // (stat.numeric64 ? datFile.fieldSize.LONGLONG : 0),
    (stat.numeric32 ? datFile.fieldSize.LONG : 0),
    // (stat.numeric16 ? datFile.fieldSize.SHORT : 0),
    (datFile.fieldSize.BYTE)
  ]))
  const maxReadBytes = Math.ceil(header.textLength! / 3)

  let textY = 0
  for (const rowIdx of rows) {
    const arrayLength = datFile.readerFixed.getUint32((rowIdx * datFile.rowLength) + header.offset, true)
    if (arrayLength === 0) {
      ctx.fillText('[]', 0, textY)
    } else {
      const varOffset = datFile.readerFixed.getUint32((rowIdx * datFile.rowLength) + header.offset + datFile.memsize, true)

      const data = datFile.dataVariable.subarray(
        varOffset,
        varOffset + Math.min(entryMaxLength * arrayLength, maxReadBytes)
      )
      const hexDump = Array.from(data, byte =>
        byte.toString(16).padStart(2, '0')
      ).join(' ')

      ctx.fillText(`${arrayLength} { ${hexDump} }`, 0, textY)
    }
    textY += LINE_HEIGHT
  }
}
