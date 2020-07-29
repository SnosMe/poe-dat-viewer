import { Header } from './headers'

export const IMPORT_DAT_NAME = 'Russian/BaseItemTypes'

export const IMPORT_HDRS: Header[] = [
  {
    name: 'Id',
    offset: 0,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'ItemClassesKey',
    offset: 4,
    length: 8,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Width',
    offset: 12,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Height',
    offset: 16,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Name',
    offset: 20,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'InheritsFrom',
    offset: 24,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'DropLevel',
    offset: 28,
    length: 4,
    type: {
      byteView: {}
    }
  },
  {
    name: 'FlavourTextKey',
    offset: 32,
    length: 8,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Implicit_ModsKeys',
    offset: 40,
    length: 8,
    type: {
      byteView: {}
    }
  },
  {
    name: 'Unknown1',
    offset: 48,
    length: 4,
    type: {
      byteView: {}
    }
  }
]
