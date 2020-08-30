import { Header } from '../viewer/headers'
import { getNamePart } from '../dat/dat-file'
import { ColumnStats } from '../dat/analysis'

interface DatSerializedHeader {
  name: string | null
  length?: number
  type: {
    ref?: { array: boolean }
    boolean?: {}
    integer?: { unsigned: boolean, size: number }
    decimal?: { size: number }
    string?: {}
    key?: { foreign: boolean }
  }
}

export function exportInternalState (headers: Header[], path: string) {
  return JSON.stringify({
    name: getNamePart(path),
    headers: serializeHeaders(headers)
  }, null, 2)
}

function serializeHeaders (headers: Header[]) {
  return headers.map<DatSerializedHeader>(header => ({
      name: header.name,
    length: (header.type.ref || header.type.key) ? undefined : header.length,
    type: {
      ...header.type,
      byteView: undefined
    }
    }))
}

}
