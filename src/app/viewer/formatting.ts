import { StateColumn } from './Viewer'
import { DatFile } from '../dat/dat-file'
import { Header } from './headers'
import { FIELD_SIZE, readColumn } from '../dat/reader'
import { ColumnStats } from '../dat/analysis'

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
    /* subscribe to Vue reactivity */
    // eslint-disable-next-line no-unused-expressions
    col.header?.type.integer?.unsigned

    return {
      offset: col.offset,
      length: 1,
      selected: col.selected,
      dataStart: col.dataStart,
      cachedView: (col.header && (!col.header.type.byteView || col.header.type.byteView.array))
        ? col.header.cachedView
        : null
    }
  }

  if (!columns.length) return fmt

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

function readArrayVarData (offset: number, length: number, datFile: DatFile) {
  const arrayLength = datFile.readerFixed.getSizeT(offset)
  const varOffset = datFile.readerFixed.getSizeT(offset + datFile.memsize)

  if (arrayLength === 0) {
    return { value: [], size: 0 }
  }

  return {
    value: Array.from(
      datFile.dataVariable.subarray(varOffset, varOffset + (length * arrayLength))
    ),
    size: arrayLength
  }
}

export function cacheHeaderArrayVarData (header: Header, stats: ColumnStats, datFile: DatFile) {
  if (!stats.refArray) throw Error('never')

  const entryMaxLength = Math.max(...([
    [FIELD_SIZE.KEY_FOREIGN[datFile.memsize], stats.refArray.keyForeign],
    [FIELD_SIZE.KEY[datFile.memsize], stats.refArray.keySelf],
    [FIELD_SIZE.STRING[datFile.memsize], stats.refArray.string],
    [FIELD_SIZE.LONGLONG, stats.refArray.longLong],
    [FIELD_SIZE.LONG, stats.refArray.long],
    [FIELD_SIZE.SHORT, stats.refArray.short],
    [1, true]
  ] as [number, boolean][]).map(([size, isValid]) => isValid ? size : 0))

  const entriesRaw = Array(datFile.rowCount).fill(undefined).map((_, rowIdx) => {
    return readArrayVarData((rowIdx * datFile.rowLength) + header.offset, entryMaxLength, datFile)
  })

  const maxArrayLength = Math.max(...entriesRaw.map(_ => _.size))

  let length = 0

  const entries = entriesRaw.map<[string, number]>(({ value, size }) => {
    let text = ''

    if (!value.length) {
      text = '[]'
    } else {
      const hexDump = value
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ')

      text = `${String(size).padStart(maxArrayLength, ' ')} { ${hexDump} }`
    }

    length = Math.max(length, text.length)

    return [text, 0]
  })

  length = medianEntriesLength(entries)
  length = Math.max(length, (4 * 3 - 1))

  header.cachedView = Object.freeze({
    length,
    entries,
    entriesRaw: entriesRaw.map(_ => _.value)
  })
}

export function calcRowNumLength (rowCount: number, rowNumStart: number, minLength: number) {
  const maxLen = String(rowCount - 1 + rowNumStart).length
  return Math.max(maxLen, minLength)
}

export function cacheHeaderDataView (header: Header, datFile: DatFile) {
  const entriesRaw = readColumn(header, datFile)

  // NOTE: length of the string is in UTF-16 code units, not code points!
  let length = 0

  const entries = entriesRaw.map<[string, number]>((value) => {
    let text = ''
    let color = 0

    if (Array.isArray(value) && header.type.ref?.array) {
      if (header.type.boolean) {
        text = `[${value.join(', ')}]`
        color = 3
      } else if (header.type.string) {
        text = `[${(value as string[]).map(_ => '"' + _ + '"').join(', ')}]`
        color = 1
      } else if (header.type.integer || header.type.decimal) {
        text = `[${value.join(', ')}]`
        color = 2
      } else if (header.type.key) {
        if (header.type.key.foreign) {
          text = `[${(value as Array<[number, number]>).map(rowIdx => `<${rowIdx[0]}, ${rowIdx[1]}>`).join(', ')}]`
        } else {
          text = `[${(value as number[]).map(rowIdx => `<${rowIdx}, self>`).join(', ')}]`
        }
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
      } else if (header.type.key) {
        if (value === null) {
          text = 'null'
          color = 3
        } else {
          if (header.type.key.foreign) {
            text = `<${(value as unknown as [number, number])[0]}, ${(value as unknown as [number, number])[1]}>`
          } else {
            text = `<${value}, self>`
          }
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
  length = Math.max(length, (4 * 3 - 1))

  header.cachedView = Object.freeze({
    length,
    entries,
    entriesRaw
  })
}

function medianEntriesLength (entries: Array<[string, number]>) {
  const arr = entries
    .filter(_ => _[0] !== '[]' && _[0] !== 'null')
    .map(_ => _[0].length)
  if (!arr.length) return 0
  arr.sort((a, b) => b - a)
  const mid = Math.floor(arr.length / 2)
  const median = arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
  return Math.min(median + (4 * 3 - 1), arr[0], Math.floor(median * 1.20))
}
