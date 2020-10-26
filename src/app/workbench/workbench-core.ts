import { shallowRef, shallowReactive, DefineComponent } from 'vue'
import ImportDialog from './ImportDialog.vue'

export const settings = shallowReactive({
  rowNumStart: 0,
  colNumStart: 0
})

interface Tab {
  id: string
  title: string
  type: DefineComponent
  args: unknown
  kaState: unknown
}

export const activeTabId = shallowRef('poe-dat-viewer@import')

export const tabs = shallowRef<Tab[]>([
  {
    id: 'poe-dat-viewer@import',
    title: 'Import',
    type: ImportDialog,
    args: undefined,
    kaState: undefined
  }
])

interface OpenTabParams {
  id: string
  title: string
  type: DefineComponent
  args: unknown
}

export function openTab (params: OpenTabParams) {
  const existing = tabs.value.find(tab => tab.id === params.id)
  if (!existing) {
    tabs.value.push({
      id: params.id,
      title: params.title,
      type: params.type,
      args: params.args,
      kaState: undefined
    })
  }
  activeTabId.value = params.id
}
