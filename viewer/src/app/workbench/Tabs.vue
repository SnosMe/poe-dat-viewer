<template>
  <div :class="$style.titlebar">
    <div class="flex overflow-hidden divide-x divide-gray-600">
      <div v-for="tab in tabs" :key="tab.id"
        :class="[$style.tab, { [$style.active]: tab.isActive }]">
        <button class="pl-3 h-full"
          @click="setActiveTab(tab.id)"
          @click.middle="closeTab(tab.id)">{{ tab.title }}</button>
        <button class="mx-2 w-7 h-7 hover:bg-gray-500 text-center" title="Close"
          @click="closeTab(tab.id)"><i class="codicon codicon-close"></i></button>
      </div>
    </div>
    <div class="flex p-1.5 shrink-0 gap-x-1">
      <button :class="$style.rightBtn"
        @click="openImport"><i class="codicon codicon-cloud-download"></i> Import</button>
      <button v-if="showDataTables" :class="$style.rightBtn"
        @click="openDataTables"><i class="codicon codicon-table"></i> Data Tables</button>
      <!-- <button :class="$style.rightBtn" title="Help"><i class="codicon codicon-question"></i></button> -->
      <!-- <button :class="$style.rightBtn" title="Settings"><i class="codicon codicon-settings"></i></button> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject } from 'vue'
import { tabs, activeTabId, setActiveTab, closeTab, openTab } from './workbench-core.js'
import type { BundleIndex } from '@/app/patchcdn/index-store.js'
import type { DatSchemasDatabase } from '@/app/dat-viewer/db.js'
import ImportDialog from './ImportDialog.vue'
import DataTablesDialog from './DataTablesDialog.vue'

export default defineComponent({
  name: 'WorkbenchTabs',
  setup () {
    const index = inject<BundleIndex>('bundle-index')!
    const db = inject<DatSchemasDatabase>('dat-schemas')!

    const _tabs = computed(() =>
      tabs.value.map(tab => ({
        id: tab.id,
        title: tab.title,
        isActive: (tab.id === activeTabId.value)
      }))
    )

    function openImport () {
      openTab({
        id: 'poe-dat-viewer@import',
        title: 'Import',
        type: ImportDialog,
        args: undefined
      })
    }

    function openDataTables () {
      openTab({
        id: 'poe-dat-viewer@data-tables',
        title: 'Data Tables',
        type: DataTablesDialog,
        args: undefined
      })
    }

    return {
      tabs: _tabs,
      setActiveTab,
      closeTab,
      openImport,
      openDataTables,
      showDataTables: computed(() => {
        return index.isLoaded && db.isLoaded
      })
    }
  }
})
</script>

<style lang="postcss" module>
.titlebar {
  display: flex;
  justify-content: space-between;
  @apply bg-gray-700;
  @apply text-gray-50;
  z-index: 1;
  line-height: 1;
  min-height: 35px;
}

.tab {
  display: flex;
  align-items: center;
  white-space: nowrap;

  &:hover {
    @apply bg-gray-600;
  }

  &.active {
    @apply bg-gray-800;

    &:hover {
      @apply bg-gray-600;
      @apply text-white;
    }
  }
}

.rightBtn {
  @apply px-2;
  @apply gap-x-1;
  display: flex;
  align-items: center;

  &:hover {
    @apply bg-gray-300;
    @apply text-black;
  }
}
</style>
