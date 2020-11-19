import { openDB, DBSchema } from 'idb'
import type { Header } from './headers'
import { schema, SchemaEnum, SchemaTable } from '@/assets/schema'

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
  return record?.headers || fromJsonSchema(name) || []
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

function fromJsonSchema (name: string): ViewerSerializedHeader[] | null {
  const sch = schema.find(s => s.name === name)
  if (!sch || (sch as SchemaEnum).enum) return null

  return (sch as SchemaTable).columns.map(column => {
    return { /* eslint-disable indent */
      name: column.name,
      type: {
        array: column.array,
        integer:
          column.type === 'uint8' ? { unsigned: true, size: 1 }
          : column.type === 'uint16' ? { unsigned: true, size: 2 }
          : column.type === 'uint32' ? { unsigned: true, size: 4 }
          : column.type === 'uint64' ? { unsigned: true, size: 8 }
          : column.type === 'int8' ? { unsigned: false, size: 1 }
          : column.type === 'int16' ? { unsigned: false, size: 2 }
          : column.type === 'int32' ? { unsigned: false, size: 4 }
          : column.type === 'int64' ? { unsigned: false, size: 8 }
          // TODO: dedicated type
          : column.type === 'enum0' || column.type === 'enum1' ? { unsigned: true, size: 4 }
          : undefined,
        decimal:
          column.type === 'float32' ? { size: 4 }
          : column.type === 'float64' ? { size: 8 }
          : undefined,
        string:
          column.type === 'string' ? {}
          : undefined,
        boolean:
          column.type === 'bool' ? {}
          : undefined,
        key:
          column.type === 'rowidx' ? {
            foreign: column.references ? (column.references as { table: string }).table !== name : false
          }
          : undefined
      },
      textLength: 4 * 3 - 1
    }
  })
}
