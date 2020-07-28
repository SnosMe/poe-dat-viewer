import { DatFile } from './dat-file'

export interface ColumnStats {
  b00: boolean
  b01: boolean
  bMax: number
  nullableLong: boolean
  refString: boolean
  refArray: {
    boolean: boolean
    short: boolean
    long: boolean
    longLong: boolean
    string: boolean
  } | false
}

export function analyze (datFile: DatFile) {
  const isValidVariableOffset = (offset: number) =>
    offset < datFile.readerVariable.byteLength && offset >= 4

  const stats = new Array(datFile.rowLength).fill(undefined)
    .map<ColumnStats>(_ => ({
      b00: true,
      b01: true,
      bMax: 0,
      nullableLong: false,
      refString: true,
      refArray: {
        boolean: true,
        short: true,
        long: true,
        longLong: true,
        string: true
      }
    }))

  for (let bi = 0; bi < datFile.rowLength; bi += 1) {
    const stat = stats[bi]
    const sLong = (datFile.rowLength - bi) >= 4
    const sLongLong = (datFile.rowLength - bi) >= 8

    if (!sLong) {
      stat.refString = false
    }

    if (!sLongLong) {
      stat.refArray = false
    }

    for (let ri = 0; ri < datFile.rowCount; ri += 1) {
      const row = ri * datFile.rowLength

      const byte = datFile.dataFixed[row + bi]
      stat.b00 = stat.b00 && (byte === 0x00)
      stat.b01 = stat.b01 && (byte === 0x01)
      stat.bMax = Math.max(stat.bMax, byte)

      if (!stat.nullableLong && sLong) {
        stat.nullableLong = (
          byte === 0xfe &&
          datFile.readerFixed.getUint32(row + bi, true) === 0xfefefefe
        )
      }

      if (stat.refString) {
        const varOffset = datFile.readerFixed.getUint32(row + bi, true)
        stat.refString = isValidVariableOffset(varOffset) &&
          isStringAtOffset(varOffset, datFile.readerVariable)
      }

      if (stat.refArray) {
        const arrayLength = datFile.readerFixed.getUint32(row + bi, true)
        const varOffset = datFile.readerFixed.getUint32(row + bi + 4, true)
        if (
          !isValidVariableOffset(varOffset) ||
          !isValidVariableOffset(varOffset + (1 * arrayLength))
        ) {
          if (arrayLength !== 0 || varOffset !== datFile.readerVariable.byteLength) {
            stat.refArray = false
          }
        } else {
          stat.refArray.short = stat.refArray.short &&
            isValidVariableOffset(varOffset + (2 * arrayLength))
          stat.refArray.long = stat.refArray.long &&
            isValidVariableOffset(varOffset + (4 * arrayLength))
          stat.refArray.longLong = stat.refArray.longLong &&
            isValidVariableOffset(varOffset + (8 * arrayLength))
          stat.refArray.string = stat.refArray.string &&
            isValidVariableOffset(varOffset + (4 * arrayLength))

          for (let idx = 0; idx < arrayLength && stat.refArray.string; idx += 1) {
            const strOffset = datFile.readerVariable.getUint32(varOffset + (4 * idx), true)
            stat.refArray.string = isValidVariableOffset(strOffset) &&
              isStringAtOffset(strOffset, datFile.readerVariable)
          }

          for (let idx = 0; idx < arrayLength && stat.refArray.boolean; idx += 1) {
            stat.refArray.boolean = (
              datFile.dataVariable[varOffset + idx] === 0x00 ||
              datFile.dataVariable[varOffset + idx] === 0x01
            )
          }

          if (
            !stat.refArray.string &&
            !stat.refArray.longLong &&
            !stat.refArray.long &&
            !stat.refArray.short &&
            !stat.refArray.boolean
          ) {
            stat.refArray = false
          }
        }
      }
    }
  }

  return stats
}

function isStringAtOffset (offset: number, data: DataView) {
  while (true) {
    if ((offset + 3) >= data.byteLength) {
      return false
    }
    const c1 = data.getUint16(offset, true)
    const c2 = data.getUint16(offset + 2, true)
    if (c1 === 0x0000 && c2 === 0x0000) {
      break
    }
    // + 0000 = 00000
    // + D7FF = 55295
    // h D800 = 55296
    // h DBFF = 56319
    // l DC00 = 56320
    // l DFFF = 57343
    // + E000 = 57344
    // + FFFF = 65535
    if (c1 > 0xD7FF && c1 < 0xE000) {
      if (c1 > 0xDBFF) {
        return false
      }
      if (c2 < 0xDC00 || c2 > 0xDFFF) {
        return false
      } else {
        offset += 4
      }
    } else {
      offset += 2
    }
  }
  return true
}
