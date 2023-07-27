import { openDB, type DBSchema } from 'idb'
import { type Ref, shallowRef, triggerRef } from 'vue'
import { type SchemaFile, SCHEMA_VERSION } from 'pathofexile-dat-schema'
import { fromSerializedHeaders, type Header } from './headers.js'
import type { BundleIndex } from '@/app/patchcdn/index-store.js'
import { readDatFile } from 'pathofexile-dat/dat.js'
import { decompressFileInBundle, analyzeDatFile } from '../worker/interface.js'

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

export interface TableStats {
  name: string
  totalRows: number
  headersValid: boolean
  increasedRowLength: boolean
}

export class DatSchemasDatabase {
  private readonly publicSchema = shallowRef<SchemaFile['tables']>([])
  private readonly _isLoading = shallowRef(false)
  get isLoaded () { return this.publicSchema.value.length > 0 }
  get isLoading () { return this._isLoading.value }

  private readonly _tableStats = shallowRef<TableStats[]>([])
  get tableStats () {
    return this._tableStats.value as readonly TableStats[]
  }

  constructor (
    private readonly index: BundleIndex
  ) {}

  private readonly db = openDB<PoeDatViewerSchema>('poe-dat-viewer', 3, {
    upgrade (db) {
      db.createObjectStore('dat-schemas', { keyPath: 'name' })
    }
  })

  async fetchSchema () {
    this._isLoading.value = true
    const response = await fetch('https://poe-bundles.snos.workers.dev/schema.min.json')
    const schema: SchemaFile = await response.json()
    if (schema.version === SCHEMA_VERSION) {
      this.publicSchema.value = schema.tables
    } else {
      console.warn('Latest schema version is not supported.')
    }
    this._isLoading.value = false
  }

  async findSchemaByName (name: string): Promise<DatSchema | null> {
    const record = await (await this.db).get('dat-schemas', name)
    return record ?? fromPublicSchema(name, this.publicSchema.value)
  }

  async findByName (name: string) {
    const schema = await this.findSchemaByName(name)
    return schema?.headers ?? []
  }

  async saveHeaders (
    name: string,
    headers: Header[]
  ) {
    await (await this.db).put('dat-schemas', {
      name,
      headers: serializeHeaders(headers)
    })
  }

  async removeHeaders (name: string) {
    await (await this.db).delete('dat-schemas', name)
  }

  async preloadDataTables (totalTables: Ref<number>) {
    const filePaths = this.index.getDirContent('data')
      .files
      .filter(file => file.endsWith('.dat64')) // this also removes special `Languages.dat`

    totalTables.value = filePaths.length

    const filesInfo = await this.index.getBatchFileInfo(filePaths)

    const byBundle = filesInfo.reduce<Array<{
      name: string
      files: Array<{ fullPath: string, location: { offset: number, size: number } }>
    }>>((byBundle, location, idx) => {
      const found = byBundle.find(bundle => bundle.name === location.bundle)
      const fullPath = filePaths[idx]
      if (found) {
        found.files.push({ fullPath, location })
      } else {
        byBundle.push({
          name: location.bundle,
          files: [{ fullPath: filePaths[idx], location }]
        })
      }
      return byBundle
    }, [])

    for (const bundle of byBundle) {
      let bundleBin = await this.index.loader.fetchFile(bundle.name)
      for (const { fullPath, location } of bundle.files) {
        const res = await decompressFileInBundle(bundleBin, location.offset, location.size)
        bundleBin = res.bundle

        const datFile = readDatFile(fullPath, res.slice)
        const columnStats = await analyzeDatFile(datFile, { transfer: true })
        const name = fullPath.replace('data/', '').replace('.dat64', '')

        const schema = await this.findSchemaByName(name)
        const headers = fromSerializedHeaders(schema?.headers ?? [], columnStats, datFile)

        this._tableStats.value.push({
          name: schema?.name ?? name,
          totalRows: datFile.rowCount,
          headersValid: (headers != null),
          increasedRowLength: (headers) ? headers.increasedRowLength : false
        })
        triggerRef(this._tableStats)
      }
    }
  }
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

function fromPublicSchema (name: string, publicSchema: SchemaFile['tables']): DatSchema | null {
  name = name.toLowerCase()
  const sch = publicSchema.find(s => s.name.toLowerCase() === name)
  if (!sch) return null

  const headers: ViewerSerializedHeader[] = sch.columns.map(column => {
    return { /* eslint-disable @typescript-eslint/indent */
      name: column.name || '',
      type: {
        array: column.array,
        byteView:
          column.type === 'array' ? { array: true }
          : undefined,
        integer:
          // column.type === 'u8' ? { unsigned: true, size: 1 }
          // : column.type === 'u16' ? { unsigned: true, size: 2 }
          // : column.type === 'u32' ? { unsigned: true, size: 4 }
          // : column.type === 'u64' ? { unsigned: true, size: 8 }
          // : column.type === 'i8' ? { unsigned: false, size: 1 }
          // : column.type === 'i16' ? { unsigned: false, size: 2 }
          column.type === 'i32' ? { unsigned: false, size: 4 }
          // : column.type === 'i64' ? { unsigned: false, size: 8 }
          : column.type === 'enumrow' ? { unsigned: false, size: 4 }
          : undefined,
        decimal:
          column.type === 'f32' ? { size: 4 }
          // : column.type === 'f64' ? { size: 8 }
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

  return {
    name: sch.name,
    headers
  }
}
