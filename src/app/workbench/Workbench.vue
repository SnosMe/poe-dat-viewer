<template>
  <div style="display: flex; width: 100%; height: 100%;">
    <index-tree />
    <div class="layout-column flex-1" style="min-width: 0;">
      <viewer-tabs />
      <!-- <div class="flex no-wrap bg-blue-grey-9 q-pa-sm">
        <div class="flex no-wrap">
          <template v-if="selections.length === 0">
            <div class="text-blue-grey-4 text-italic">No bytes selected</div>
          </template>
          <template v-else-if="selections.length === 1">
            <q-btn @click="defineColumn" padding="0 sm" label="Define column" no-caps color="blue-grey-8" />
          </template>
          <template v-else-if="selections.length > 1">
            <div class="text-blue-grey-2 q-pr-xs">Selections</div>
            <div v-for="sel in selections"
              class="q-px-xs q-mr-xs font-mono bg-blue-grey-2 text-blue-grey-10 rounded-borders"
              >{{ sel }}</div>
          </template>
        </div>
        <q-space />
        <div class="flex no-wrap q-gutter-x-sm">
          <q-btn @click="viewer.rowSorting = null" v-if="viewer.rowSorting" padding="0 sm" label="Reset sorting" no-caps color="blue-grey-8" />
          <q-btn @click="exportDataJson" :disable="!viewer.datFile" padding="0 sm" label="Export data" no-caps color="blue-grey-8" />
          <q-btn @click="app.exportSchemaDialog = true" :disable="!viewer.datFile" padding="0 sm" label="Export schema" no-caps color="blue-grey-8" />
        </div>
      </div> -->
      <div class="flex min-h-0 flex-1">
        <div class="layout-column min-w-0 flex-1">
          <component :is="activeTab.type" :args="activeTab.args" class="flex-1" />
          <!-- VIEWER WAS HERE -->
          <div class="app-footer">
            <div>Made by Alexander Drozdov, v{{ appVersion }} <a class="q-link text-white border-b" href="https://github.com/SnosMe/poe-dat-viewer">GitHub</a></div>
            <a href="https://discord.gg/SJjBdT3" class="flex ml-8"><img src="@/assets/discord-badge.svg" /></a>
          </div>
        </div>
        <div class="flex-shrink-0">
          <!-- <header-props /> -->
        </div>
      </div>
      <download-progress />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import ViewerTabs from './Tabs.vue'
import IndexTree from './IndexTree.vue'
import DownloadProgress from './DownloadProgress.vue'
import { tabs, activeTabId } from './workbench-core'

export default defineComponent({
  components: { IndexTree, ViewerTabs, DownloadProgress },
  setup () {
    const activeTab = computed(() =>
      tabs.value.find(tab => tab.id === activeTabId.value)
    )

    return {
      activeTab,
      appVersion: process.env.APP_VERSION
    }
  }
})
</script>

<style lang="postcss">
.app-footer {
  line-height: 1;
  align-items: center;
  display: flex;
  @apply bg-gray-800;
  @apply text-white;
  @apply p-2;

  img {
    filter: grayscale(0.75);
  }

  &:hover {
    img {
      filter: grayscale(0);
    }
  }
}
</style>
