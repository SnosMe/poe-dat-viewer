export const schema = require('../data/schema.json') as Array<SchemaTable | SchemaEnum>

export type ColumnType =
  'uint8' | 'uint16' | 'uint32' | 'uint64' |
  'int8' | 'int16' | 'int32' | 'int64' |
  'float32' | 'float64' |
  'string' |
  'rowidx' |
  'bool' |
  'enum0' | 'enum1'

export interface TableColumn {
  name: string
  array?: boolean
  type: ColumnType | null
  unique?: boolean
  references?: { table: string, column?: string } | { enum: string }
}

export interface SchemaTable {
  name: string
  columns: TableColumn[]
}

export interface SchemaEnum {
  name: string
  enum: string[]
}
