<template>
  <index-tree />
  <div class="layout-column flex-1 min-w-0">
    <viewer-tabs />
    <div class="layout-column flex-1 min-h-0">
      <component
        v-if="activeTab"
        :is="activeTab.type"
        :args="activeTab.args"
        :key="activeTab.id"
        :ka-scope="activeTab.kaScope"
        v-model:ka-state="activeTab.kaState" />
      <div v-else
        class="bg-gray-50 flex-1 text-lg text-gray-500 flex items-center justify-center"
        >The viewer is ready to fulfill your wishes 👾</div>
    </div>
    <div class="app-footer">
      <div>Made by Alexander Drozdov, v{{ appVersion }} <a class="q-link text-white border-b" href="https://github.com/SnosMe/poe-dat-viewer">GitHub</a></div>
      <a href="https://discord.gg/SJjBdT3" class="flex ml-8"><img src="@/assets/discord-badge.svg" /></a>
    </div>
  </div>
  <download-progress />
</template>

<script lang="ts">
import { defineComponent, computed, provide } from 'vue'
import ViewerTabs from './Tabs.vue'
import IndexTree from './IndexTree.vue'
import DownloadProgress from './DownloadProgress.vue'
import { tabs, activeTabId } from './workbench-core'
import { BundleLoader } from '@/app/patchcdn/cache'
import { BundleIndex } from '@/app/patchcdn/index-store'
import { DatSchemasDatabase } from '@/app/dat-viewer/db'

export default defineComponent({
  components: { IndexTree, ViewerTabs, DownloadProgress },
  setup () {
    const loader = new BundleLoader()
    const index = new BundleIndex(loader)
    const schemaDb = new DatSchemasDatabase(index)
    provide('bundle-loader', loader)
    provide('bundle-index', index)
    provide('dat-schemas', schemaDb)

    const activeTab = computed(() =>
      tabs.value.find(tab => tab.id === activeTabId.value)
    )

    return {
      activeTab,
      appVersion: import.meta.env.APP_VERSION
    }
  }
})
</script>

<style lang="postcss">
@import "@vscode/codicons/dist/codicon.css";
@tailwind base;
@tailwind utilities;

* {
  outline: none !important;
}

#app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.5;
}

.layout-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-footer {
  line-height: 1;
  align-items: center;
  display: flex;
  @apply bg-gray-700;
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
