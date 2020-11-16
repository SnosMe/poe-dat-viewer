import { CHAR_WIDTH, LINE_HEIGHT } from '../rendering'
import { getFieldReader } from 'pathofexile-dat/dat/reader'
import type { DatFile } from 'pathofexile-dat'
import type { ColumnStats } from 'pathofexile-dat/dat-analysis'
import type { Header } from '../headers'

interface StringifyOut {
  text: string
  color: string
}

function numberToString (value: number, out: StringifyOut) {
  out.text = String(value)
  out.color = '#098658'
}
function numberArrayToString (value: number[], out: StringifyOut) {
  out.text = `[${value.join(', ')}]`
  out.color = '#098658'
}
function booleanToString (value: boolean, out: StringifyOut) {
  out.text = String(value)
  out.color = '#0000ff'
}
function booleanArrayToString (value: boolean[], out: StringifyOut) {
  out.text = `[${value.join(', ')}]`
  out.color = '#0000ff'
}
function stringToString (value: string, out: StringifyOut) {
  if (value === '') {
    out.text = 'null'
    out.color = '#0000ff'
  } else {
    out.text = String(value)
    out.color = '#001080'
  }
}
function stringArrayToString (value: string[], out: StringifyOut) {
  out.text = `[${value.map(str => '"' + str + '"').join(', ')}]`
  out.color = '#001080'
}
function keySelfToString (value: number | null, out: StringifyOut) {
  if (value === null) {
    out.text = 'null'
    out.color = '#0000ff'
  } else {
    out.text = `<${value}, self>`
    out.color = '#098658'
  }
}
function keySelfArrayToString (value: number[], out: StringifyOut) {
  out.text = `[${value.map(key => `<${key}, self>`).join(', ')}]`
  out.color = '#098658'
}
function keyForeignToString (value: { rid: number, unknown: number } | null, out: StringifyOut) {
  if (value === null) {
    out.text = 'null'
    out.color = '#0000ff'
  } else {
    out.text = `<${value.rid}, ${value.unknown}>`
    out.color = '#098658'
  }
}
function keyForeignArrayToString (value: { rid: number, unknown: number }[], out: StringifyOut) {
  out.text = `[${value.map(key => `<${key.rid}, ${key.unknown}>`).join(', ')}]`
  out.color = '#098658'
}

export function renderCellContent (ctx: CanvasRenderingContext2D, header: Header, datFile: DatFile, rows: number[]) {
  const read = getFieldReader(header, datFile)

  const draw: StringifyOut = { text: '', color: '' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stringify: (value: any, out: StringifyOut) => void = (() => {
    if (header.type.array) {
      if (header.type.boolean) return booleanArrayToString
      if (header.type.string) return stringArrayToString
      if (header.type.integer || header.type.decimal) return numberArrayToString
      if (header.type.key && header.type.key.foreign) return keyForeignArrayToString
      if (header.type.key && !header.type.key.foreign) return keySelfArrayToString
    } else {
      if (header.type.boolean) return booleanToString
      if (header.type.string) return stringToString
      if (header.type.integer || header.type.decimal) return numberToString
      if (header.type.key && header.type.key.foreign) return keyForeignToString
      if (header.type.key && !header.type.key.foreign) return keySelfToString
    }
    throw new Error('never')
  })()

  let textY = 0
  let prevColor = ''
  for (const rid of rows) {
    stringify(read(rid), draw)
    if (prevColor !== draw.color) {
      ctx.fillStyle = draw.color
      prevColor = draw.color
    }
    ctx.fillText(draw.text, 0, textY)
    textY += LINE_HEIGHT
  }
}

export function drawByteView (ctx: CanvasRenderingContext2D, header: Header, datFile: DatFile, rows: number[], begin: number, end: number) {
  ctx.fillStyle = '#000'

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

export function drawArrayVarData (ctx: CanvasRenderingContext2D, header: Header, datFile: DatFile, rows: number[], stats: ColumnStats) {
  ctx.fillStyle = '#000'

  const stat = stats.refArray as Exclude<typeof stats['refArray'], false>
  const entryMaxLength = Math.max(...([
    (stat.keyForeign ? datFile.fieldSize.KEY_FOREIGN : 0),
    (stat.keySelf ? datFile.fieldSize.KEY : 0),
    (stat.string ? datFile.fieldSize.STRING : 0),
    (stat.longLong ? datFile.fieldSize.LONGLONG : 0),
    (stat.long ? datFile.fieldSize.LONG : 0),
    (stat.short ? datFile.fieldSize.SHORT : 0),
    (datFile.fieldSize.BYTE)
  ]))
  const maxReadBytes = Math.ceil(header.textLength! / 3)

  let textY = 0
  for (const rowIdx of rows) {
    const arrayLength = datFile.readerFixed.getSizeT((rowIdx * datFile.rowLength) + header.offset)
    if (arrayLength === 0) {
      ctx.fillText('[]', 0, textY)
    } else {
      const varOffset = datFile.readerFixed.getSizeT((rowIdx * datFile.rowLength) + header.offset + datFile.memsize)

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
