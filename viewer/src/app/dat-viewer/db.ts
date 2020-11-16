import { openDB, DBSchema } from 'idb'
import type { Header } from './headers'

interface DatSchema {
  name: string
  headers: ViewerSerializedHeader[]
}

export interface ViewerSerializedHeader {
  name: string | null
  length?: number
  type: {
    byteView?: { array: boolean }
    array?: boolean
    boolean?: {}
    integer?: { unsigned: boolean, size: number }
    decimal?: { size: number }
    string?: {}
    key?: { foreign: boolean }
  }
  textLength?: number
}

interface PoeDatViewerSchema extends DBSchema {
  'dat-schemas': {
    key: DatSchema['name']
    value: DatSchema
  }
}

const db = openDB<PoeDatViewerSchema>('poe-dat-viewer', 3, {
  upgrade (db) {
    db.createObjectStore('dat-schemas', { keyPath: 'name' })
  }
})

export async function findByName (name: string) {
  const record = await (await db).get('dat-schemas', name)
  return record?.headers || []
}

export async function saveHeaders (
  name: string,
  headers: Header[]
) {
  await (await db).put('dat-schemas', {
    name,
    headers: serializeHeaders(headers)
  })
}

function serializeHeaders (headers: Header[]) {
  return headers.map<ViewerSerializedHeader>(header => ({
    ...header,
    length: (
      header.type.string ||
      header.type.array ||
      header.type.key ||
      header.type.boolean ||
      header.type.decimal ||
      header.type.integer
    ) ? undefined
      : header.length
  }))
}
