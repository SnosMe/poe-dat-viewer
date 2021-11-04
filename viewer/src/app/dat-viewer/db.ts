import { openDB, DBSchema } from 'idb'
import { shallowRef } from 'vue'
import { SchemaFile } from 'pathofexile-dat-schema'
import type { Header } from './headers'

export const publicSchema = shallowRef<SchemaFile['tables']>([])

export type ViewerSerializedHeader =
  Omit<Header, 'offset' | 'length'> & { length?: number }

interface DatSchema {
  name: string
  headers: ViewerSerializedHeader[]
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
  return record?.headers || fromPublicSchema(name) || []
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

export async function removeHeaders (name: string) {
  await (await db).delete('dat-schemas', name)
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

function fromPublicSchema (name: string): ViewerSerializedHeader[] | null {
  const sch = publicSchema.value.find(s => s.name === name)
  if (!sch) return null

  return sch.columns.map(column => {
    return { /* eslint-disable @typescript-eslint/indent */
      name: column.name || '',
      type: {
        array: column.array,
        byteView:
          column.type === 'array' ? { array: true }
          : undefined,
        integer:
          column.type === 'u8' ? { unsigned: true, size: 1 }
          : column.type === 'u16' ? { unsigned: true, size: 2 }
          : column.type === 'u32' ? { unsigned: true, size: 4 }
          : column.type === 'u64' ? { unsigned: true, size: 8 }
          : column.type === 'i8' ? { unsigned: false, size: 1 }
          : column.type === 'i16' ? { unsigned: false, size: 2 }
          : column.type === 'i32' ? { unsigned: false, size: 4 }
          : column.type === 'i64' ? { unsigned: false, size: 8 }
          : undefined,
        decimal:
          column.type === 'f32' ? { size: 4 }
          : column.type === 'f64' ? { size: 8 }
          : undefined,
        string:
          column.type === 'string' ? {}
          : undefined,
        boolean:
          column.type === 'bool' ? {}
          : undefined,
        key:
          (column.type === 'row' || column.type === 'foreignrow') ? {
            foreign: (column.type === 'foreignrow'),
            table: column.references?.table ?? null,
            viewColumn: null
          }
          : undefined
      },
      textLength: 4 * 3 - 1
    }
  })
}
