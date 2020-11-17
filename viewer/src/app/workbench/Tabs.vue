<template>
  <div :class="$style.titlebar">
    <div class="flex overflow-hidden divide-x divide-gray-700">
      <div v-for="tab in tabs" :key="tab.id"
        :class="[$style.tab, { [$style.active]: tab.isActive }]">
        <button class="pl-3 pr-1.5"
          @click="setActiveTab(tab.id)">{{ tab.title }}</button>
        <button class="pl-1.5 pr-3" title="Close"
          @click="closeTab(tab.id)"><i class="codicon codicon-close"></i></button>
      </div>
    </div>
    <div class="flex p-1.5 flex-shrink-0 space-x-1">
      <button class="hover:bg-gray-400 hover:text-black p-2"
        @click="openImport">Import</button>
      <button class="hover:bg-gray-400 hover:text-black px-2" title="Help"><i class="codicon codicon-question"></i></button>
      <button class="hover:bg-gray-400 hover:text-black px-2" title="Settings"><i class="codicon codicon-settings"></i></button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { tabs, activeTabId, setActiveTab, closeTab, openTab } from './workbench-core'
import ImportDialog from './ImportDialog.vue'

export default defineComponent({
  setup () {
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

    return {
      tabs: _tabs,
      setActiveTab,
      closeTab,
      openImport
    }
  }
})
</script>

<style lang="postcss" module>
.titlebar {
  display: flex;
  justify-content: space-between;
  @apply bg-gray-800;
  @apply text-gray-100;
  z-index: 1;
  line-height: 1;
}

.tab {
  display: flex;

  &:hover {
    @apply bg-gray-400;
    @apply text-black;
  }

  &.active {
    @apply bg-gray-900;

    &:hover {
      @apply bg-gray-700;
      @apply text-white;
    }
  }
}
</style>
