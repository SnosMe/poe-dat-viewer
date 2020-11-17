import { shallowRef, shallowReactive, DefineComponent, triggerRef } from 'vue'
import ImportDialog from './ImportDialog.vue'

interface Tab {
  id: string
  title: string
  type: DefineComponent
  args: unknown
  kaState: unknown
}

export const activeTabId = shallowRef<string | null>('poe-dat-viewer@import')

export function setActiveTab (id: string | null) {
  activeTabId.value = id
}

export const tabs = shallowRef<Tab[]>([
  {
    id: 'poe-dat-viewer@import',
    title: 'Import',
    type: ImportDialog as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    args: undefined,
    kaState: undefined
  }
])

interface OpenTabParams {
  id: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: any // vue.DefineComponent
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
  setActiveTab(params.id)
  triggerRef(tabs)
}

export function closeTab (id: string) {
  const idx = tabs.value.findIndex(tab => tab.id === id)
  if (id === activeTabId.value) {
    if ((idx + 1) < tabs.value.length) {
      setActiveTab(tabs.value[idx + 1].id)
    } else if (idx !== 0) {
      setActiveTab(tabs.value[idx - 1].id)
    } else {
      setActiveTab(null)
    }
  }
  tabs.value = tabs.value.filter(tab => tab.id !== id)
}
