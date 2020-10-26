<template>
  <div :class="$style.titlebar">
    <div class="mx-4 pt-2 flex overflow-hidden">
      <div v-for="tab in tabs" :key="tab.id"
        :class="[$style.tab, { [$style.active]: tab.isActive }]">
        <button class="pl-2 pr-1 py-2">{{ tab.title }}</button>
        <button class="pl-1 pr-2 py-2"><i class="las la-times"></i></button>
      </div>
    </div>
    <div class="p-2 flex-shrink-0">
      <button class="hover:bg-gray-400 hover:text-black p-1 mr-1">Import</button>
      <button class="hover:bg-gray-400 hover:text-black p-1 mr-1">Help</button>
      <button class="hover:bg-gray-400 hover:text-black p-1">Settings</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { tabs, activeTabId } from './workbench-core'

export default defineComponent({
  setup () {
    const _tabs = computed(() =>
      tabs.value.map(tab => ({
        id: tab.id,
        title: tab.title,
        isActive: (tab.id === activeTabId.value)
      }))
    )

    return {
      tabs: _tabs
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
  align-items: baseline;
  @apply mx-px;

  &:hover {
    @apply bg-gray-400;
    @apply text-black;
  }

  &.active {
    @apply bg-gray-900;
    @apply border-t border-gray-600;
    @apply -mt-px;

    &:hover {
      @apply bg-gray-700;
      @apply text-white;
    }
  }
}
</style>
