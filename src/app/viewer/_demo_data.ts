import { DatSerializedHeader } from '../exporters/internal'

export const DEMO_HDRS: DatSerializedHeader[] = [
  {
    name: 'Id',
    type: {
      ref: { array: false },
      string: {}
    }
  },
  {
    name: 'ItemClassesKey',
    type: {
      key: { foreign: true }
    }
  },
  {
    name: 'Width',
    length: 4,
    type: {
      integer: { unsigned: true, size: 4 }
    }
  },
  {
    name: 'Height',
    length: 4,
    type: {
      integer: { unsigned: true, size: 4 }
    }
  },
  {
    name: 'Name',
    type: {
      ref: { array: false },
      string: {}
    }
  }
]
