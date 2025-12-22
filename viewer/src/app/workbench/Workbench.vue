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
        class="flex-1 text-lg flex items-center justify-center empty-state"
        >The viewer is ready to fulfill your wishes 👾</div>
    </div>
    <div class="app-footer">
      <div>Made by Alexander Drozdov, {{ appVersion.slice(0, 7) }} · <a class="q-link text-white border-b" href="https://github.com/SnosMe/poe-dat-viewer">GitHub</a></div>
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
import { tabs, activeTabId } from './workbench-core.js'
import { BundleLoader } from '@/app/patchcdn/cache.js'
import { BundleIndex } from '@/app/patchcdn/index-store.js'
import { DatSchemasDatabase } from '@/app/dat-viewer/db.js'

export default defineComponent({
  name: 'AppWorkbench',
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

:root {
  --color-page: #f3f4f6;
  --color-surface: #ffffff;
  --color-surface-alt: #f8fafc;
  --color-surface-elevated: #e5e7eb;
  --color-toolbar: #1f2937;
  --color-toolbar-active: #111827;
  --color-toolbar-hover: #374151;
  --color-toolbar-text: #f8fafc;
  --color-toolbar-text-muted: #cbd5f5;
  --color-text: #111827;
  --color-text-muted: #4b5563;
  --color-text-inverse: #f8fafc;
  --color-border: #d1d5db;
  --color-border-subtle: #e5e7eb;
  --color-border-strong: #94a3b8;
  --color-hover: rgba(148, 163, 184, 0.18);
  --color-hover-strong: rgba(59, 130, 246, 0.12);
  --color-selection-soft: #dbeafe;
  --color-selection-strong: #60a5fa;
  --color-scroll-thumb: rgba(71, 85, 105, 0.45);
  --color-scroll-thumb-hover: rgba(71, 85, 105, 0.65);
  --color-footer-border: rgba(255, 255, 255, 0.12);
  --color-overlay-shadow: rgba(202, 202, 202, 1);
}

:root[data-theme="dark"] {
  --color-page: #101418;
  --color-surface: #161b22;
  --color-surface-alt: #1f242d;
  --color-surface-elevated: #262c36;
  --color-toolbar: #1f2833;
  --color-toolbar-active: #273242;
  --color-toolbar-hover: #2d3a4a;
  --color-toolbar-text: #f3f4f6;
  --color-toolbar-text-muted: #9ca3af;
  --color-text: #f3f4f6;
  --color-text-muted: #9ca3af;
  --color-text-inverse: #101418;
  --color-border: #2d3645;
  --color-border-subtle: #1f262f;
  --color-border-strong: #3d4758;
  --color-hover: rgba(148, 163, 184, 0.15);
  --color-hover-strong: rgba(96, 165, 250, 0.3);
  --color-selection-soft: rgba(96, 165, 250, 0.28);
  --color-selection-strong: #3b82f6;
  --color-scroll-thumb: rgba(148, 163, 184, 0.4);
  --color-scroll-thumb-hover: rgba(248, 250, 252, 0.6);
  --color-footer-border: rgba(148, 163, 184, 0.2);
  --color-overlay-shadow: rgba(6, 8, 12, 0.85);
}

body {
  margin: 0;
  background-color: var(--color-page);
  color: var(--color-text);
}

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
  background: var(--color-page);
  color: var(--color-text);
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
  padding: 0.5rem;
  background: var(--color-toolbar);
  color: var(--color-toolbar-text);
  border-top: 1px solid var(--color-footer-border);

  img {
    filter: grayscale(0.75);
  }

  &:hover {
    img {
      filter: grayscale(0);
    }
  }
}

.empty-state {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
}

.text-muted {
  color: var(--color-text-muted);
}

:root[data-theme="dark"] .bg-white {
  background-color: var(--color-surface) !important;
  color: var(--color-text) !important;
}
:root[data-theme="dark"] .bg-gray-50,
:root[data-theme="dark"] .bg-gray-100 {
  background-color: var(--color-surface-alt) !important;
  color: var(--color-text) !important;
}
:root[data-theme="dark"] .bg-gray-200,
:root[data-theme="dark"] .bg-gray-300 {
  background-color: var(--color-surface-elevated) !important;
  color: var(--color-text) !important;
}
:root[data-theme="dark"] .bg-gray-500,
:root[data-theme="dark"] .bg-gray-600,
:root[data-theme="dark"] .bg-gray-700,
:root[data-theme="dark"] .bg-gray-800 {
  background-color: var(--color-toolbar) !important;
  color: var(--color-toolbar-text) !important;
}
:root[data-theme="dark"] .text-gray-500,
:root[data-theme="dark"] .text-gray-600 {
  color: var(--color-text-muted) !important;
}
:root[data-theme="dark"] .text-gray-200,
:root[data-theme="dark"] .text-gray-50 {
  color: var(--color-toolbar-text) !important;
}
:root[data-theme="dark"] .border-gray-100,
:root[data-theme="dark"] .border-gray-200,
:root[data-theme="dark"] .border-gray-300 {
  border-color: var(--color-border) !important;
}
:root[data-theme="dark"] .border-gray-400,
:root[data-theme="dark"] .border-gray-500,
:root[data-theme="dark"] .border-gray-600 {
  border-color: var(--color-border-strong) !important;
}
:root[data-theme="dark"] .hover\:bg-gray-300:hover,
:root[data-theme="dark"] .hover\:bg-gray-100:hover,
:root[data-theme="dark"] .hover\:bg-gray-500:hover {
  background-color: var(--color-hover) !important;
  color: var(--color-text) !important;
}
:root[data-theme="dark"] .hover\:text-black:hover {
  color: var(--color-text) !important;
}
</style>
