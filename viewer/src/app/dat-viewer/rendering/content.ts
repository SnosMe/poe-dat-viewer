import { CHAR_WIDTH, LINE_HEIGHT } from '../rendering'
import { getFieldReader } from 'pathofexile-dat/dat/reader'
import type { DatFile, Header as DatHeader } from 'pathofexile-dat'
import type { ColumnStats } from 'pathofexile-dat/dat-analysis'
import type { Header as HeaderViewer } from '../headers'

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
    out.text = 'empty'
    out.color = '#0000ff'
  } else {
    out.text = String(value)
    out.color = '#001080'
  }
}
function stringArrayToString (value: string[], out: StringifyOut) {
  out.text = `[${value.map(str => JSON.stringify(str)).join(', ')}]`
  out.color = '#001080'
}
function keySelfToString (value: number | null, out: StringifyOut) {
  if (value === null) {
    out.text = '<null, self>'
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
function keyForeignToString (value: number | null, out: StringifyOut) {
  if (value === null) {
    out.text = '<null>'
    out.color = '#0000ff'
  } else {
    out.text = `<${value}>`
    out.color = '#098658'
  }
}
function keyForeignArrayToString (value: number[], out: StringifyOut) {
  out.text = `[${value.map(key => `<${key}>`).join(', ')}]`
  out.color = '#098658'
}

export function renderCellContent (
  ctx: CanvasRenderingContext2D,
  header: DatHeader,
  datFile: DatFile,
  rows: number[],
  referenced?: { header: DatHeader, datFile: DatFile }
) {
  const read = getFieldReader(header, datFile)

  if (referenced?.header.type.array) {
    throw new Error('Can\'t show array of arrays.')
  }
  type ReadReferencedReturn = (rowIdx: number) => Exclude<ReturnType<ReturnType<typeof getFieldReader>>, any[]>
  const readReferenced = referenced && getFieldReader(referenced.header, referenced.datFile) as ReadReferencedReturn

  const draw: StringifyOut = { text: '', color: '' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stringify: (value: any, out: StringifyOut) => void = (() => {
    const type = (referenced != null) ? referenced.header.type : header.type
    if (header.type.array) {
      if (type.boolean) return booleanArrayToString
      if (type.string) return stringArrayToString
      if (type.integer || type.decimal) return numberArrayToString
      if (type.key?.foreign) return keyForeignArrayToString
      if (type.key) return keySelfArrayToString
    } else {
      if (type.boolean) return booleanToString
      if (type.string) return stringToString
      if (type.integer || type.decimal) return numberToString
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
        stringify(cellData, draw)
      } else {
        if (cellData === null) {
          const stringify = (header.type.key!.foreign) ? keyForeignToString : keySelfToString
          stringify(cellData, draw)
        } else {
          cellData = readReferenced!(cellData as number)
          stringify(cellData, draw)
        }
      }
    } else {
      stringify(cellData, draw)
    }

    if (prevColor !== draw.color) {
      ctx.fillStyle = draw.color
      prevColor = draw.color
    }
    ctx.fillText(draw.text, 0, textY)
    textY += LINE_HEIGHT
  }
}

export function drawByteView (ctx: CanvasRenderingContext2D, header: DatHeader, datFile: DatFile, rows: number[], begin: number, end: number) {
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

export function drawArrayVarData (ctx: CanvasRenderingContext2D, header: HeaderViewer, datFile: DatFile, rows: number[], stats: ColumnStats) {
  ctx.fillStyle = '#000'

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
