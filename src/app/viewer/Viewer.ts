import { DatFile } from '../dat/dat-file'
import { analyze, ColumnStats } from '../dat/analysis'
import { Header, createHeaderFromSelected } from './headers'
import { selectColsByHeader, clearColumnSelection } from './selection'
import { calcRowNumLength, cacheHeaderDataView } from './formatting'
import { DatSerializedHeader, getHeaderLength, validateImportedHeader, serializeHeaders } from '../exporters/internal'
import { updateFileHeaders } from '../dat/file-cache'
import { CPUTask } from '../cpu-task'

export interface StateColumn {
  readonly offset: number
  readonly colNum99: string
  readonly colNum100: string
  selected: boolean
  header: Header | null
  dataStart: boolean
  readonly stats: {
    string: boolean
    array: boolean
    b00: boolean
    nullable: boolean
    bMax: string
  }
}

export class App {
  exportSchemaDialog = false
  helpDialog = false
  importDialog = true
  config = {
    rowNumStart: 0,
    colNumStart: 0
  }

  viewers: Array<{ instance: Viewer }> = []

  constructor () {
    this.viewers.push({ instance: new Viewer(this) })
  }
}

const ROW_NUM_MIN_LENGTH = 4

class Viewer {
  headers = [] as Header[]
  columns = [] as StateColumn[]
  datFile = null as DatFile | null
  columnStats = [] as ColumnStats[]
  rowNumberLength = -1
  editHeader = null as Header | null
  rowSorting = null as number[] | null

  // eslint-disable-next-line no-useless-constructor
  constructor (
    private app: App
  ) {}

  async loadDat (parsed: DatFile) {
    const { app } = this
    this.columnStats = await analyze(parsed)
    this.rowNumberLength = calcRowNumLength(parsed.rowCount, app.config.rowNumStart, ROW_NUM_MIN_LENGTH)
    this.datFile = parsed
    this.columns = this.stateColumns(this.columnStats)
    this.rowSorting = null
    this.headers = [{
      name: null,
      offset: 0,
      length: parsed.rowLength,
      type: {
        byteView: {}
      }
    }]
  }

  stateColumns (columnStats: ColumnStats[]) {
    const { app } = this
    const columns = new Array(columnStats.length).fill(undefined)
      .map<StateColumn>((_, idx) => ({
        offset: idx,
        colNum99: String((idx + app.config.colNumStart) % 100).padStart(2, '0'),
        // colNum100: String(Math.floor((idx + this.app.config.colNumStart) / 100)),
        colNum100: String(idx + app.config.colNumStart).padStart(2, '0'),
        selected: false,
        header: null,
        dataStart: false,
        stats: {
          string: false,
          array: false,
          b00: columnStats[idx].b00,
          bMax: columnStats[idx].bMax.toString(16).padStart(2, '0'),
          nullable: false
        }
      }))

    for (let idx = 0; idx < columnStats.length; idx += 1) {
      const stat = columnStats[idx]
      if (stat.refString) {
        for (let k = 0; k < stat.memsize; k += 1) {
          columns[idx + k].stats.string = true
        }
      }
      if (stat.refArray) {
        for (let k = 0; k < stat.memsize * 2; k += 1) {
          columns[idx + k].stats.array = true
        }
      }
      if (stat.nullableMemsize) {
        for (let k = 0; k < stat.memsize; k += 1) {
          columns[idx + k].stats.nullable = true
        }
      }
    }

    return columns
  }

  async tryImportHeaders (serialized: DatSerializedHeader[]) {
    const { datFile, columns, columnStats, headers } = this
    let start = await CPUTask.yield()

    let offset = 0
    for (const hdrSerialized of serialized) {
      const headerLength = getHeaderLength(hdrSerialized, datFile!.memsize)
      if (hdrSerialized.name == null) {
        offset += headerLength
        continue
      }

      let header = {
        length: headerLength,
        offset: offset,
        type: hdrSerialized.type
      } as Header

      const isValid = validateImportedHeader(header, columnStats)
      if (!isValid) {
        throw new Error('The schema is invalid.')
      }

      selectColsByHeader(header, columns)
      header = createHeaderFromSelected(columns, headers)
      header.name = hdrSerialized.name
      clearColumnSelection(columns)

      const type = hdrSerialized.type
      if (type.boolean || type.decimal || type.integer || type.key || type.string) {
        header.type = type
        cacheHeaderDataView(header, this.datFile!)
        this.disableByteView(header)
      }

      offset += headerLength

      if (CPUTask.mustYield(start)) {
        start = await CPUTask.yield()
      }
    }
  }

  async saveHeadersToFileCache () {
    await updateFileHeaders(
      serializeHeaders(this.headers),
      this.datFile!.meta.sha256
    )
  }

  disableByteView (header: Header) {
    const { columns } = this
    header.type.byteView = undefined
    const colIdx = columns.findIndex(col => col.offset === header.offset)
    columns.splice(colIdx + 1, header.length - 1)
    columns[colIdx].header = header
    columns[colIdx].selected = false
  }

  enableByteView (header: Header) {
    const { columns, columnStats } = this
    header.type.byteView = {}
    const colIdx = columns.findIndex(col => col.offset === header.offset)
    const fresh = this.stateColumns(columnStats)
    columns.splice(colIdx + 1, 0, ...fresh.slice(header.offset + 1, header.offset + header.length))
    columns[colIdx].header = null
  }
}
