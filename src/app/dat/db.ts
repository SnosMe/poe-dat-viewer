import { openDB, DBSchema } from 'idb'
import { DatSerializedHeader } from '../exporters/internal'

export interface DatSchema {
  name: string
  headers: DatSerializedHeader[]
}

interface PoeDatViewerSchema extends DBSchema {
  'dat-schemas': {
    key: DatSchema['name']
    value: DatSchema
  }
}

const db = openDB<PoeDatViewerSchema>('poe-dat-viewer', 2, {
  upgrade (db) {
    db.createObjectStore('dat-schemas', { keyPath: 'name' })
  }
})

export async function findByName (name: string) {
  const record = await (await db).get('dat-schemas', name)
  return record?.headers || []
}

export async function updateFileHeaders (
  name: string,
  headers: DatSerializedHeader[]
) {
  await (await db).put('dat-schemas', {
    name,
    headers
  })
}
