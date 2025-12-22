<template>
  <div :class="$style.titlebar">
    <div class="flex overflow-hidden divide-x divide-gray-600">
      <div v-for="tab in tabs" :key="tab.id"
        :class="[$style.tab, { [$style.active]: tab.isActive }]">
        <button class="pl-3 h-full"
          @click="setActiveTab(tab.id)"
          @click.middle="closeTab(tab.id)">{{ tab.title }}</button>
        <button class="mx-2 w-7 h-7 text-center" :class="$style.tabClose" title="Close"
          @click="closeTab(tab.id)"><i class="codicon codicon-close"></i></button>
      </div>
    </div>
    <div class="flex p-1.5 shrink-0 gap-x-1">
      <button :class="[$style.rightBtn, $style.themeToggle]"
        :title="themeTitle"
        @click="cycleTheme">
        <svg v-if="themeIcon === 'light'" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="12" y1="3" x2="12" y2="5.5" />
            <line x1="12" y1="18.5" x2="12" y2="21" />
            <line x1="4.8" y1="4.8" x2="6.6" y2="6.6" />
            <line x1="17.4" y1="17.4" x2="19.2" y2="19.2" />
            <line x1="3" y1="12" x2="5.5" y2="12" />
            <line x1="18.5" y1="12" x2="21" y2="12" />
            <line x1="4.8" y1="19.2" x2="6.6" y2="17.4" />
            <line x1="17.4" y1="6.6" x2="19.2" y2="4.8" />
          </g>
        </svg>
        <svg v-else-if="themeIcon === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.35 3.2a.8.8 0 0 1 .77.56 7 7 0 0 0 7.12 5.06.8.8 0 0 1 .86.86 8.5 8.5 0 1 1-8.75-8.5z" fill="currentColor" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="6" width="16" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.5" />
          <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span>{{ themeLabel }}</span>
      </button>
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
import { useTheme } from '@/theme.js'

export default defineComponent({
  name: 'WorkbenchTabs',
  setup () {
    const index = inject<BundleIndex>('bundle-index')!
    const db = inject<DatSchemasDatabase>('dat-schemas')!
    const { preference, theme, cyclePreference } = useTheme()

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

    const themeLabel = computed(() => {
      if (preference.value === 'system') {
        return `System (${theme.value === 'dark' ? 'dark' : 'light'})`
      }
      return (preference.value === 'dark') ? 'Dark' : 'Light'
    })
    const themeTitle = computed(() => `Theme: ${themeLabel.value} • click to toggle`)
    const themeIcon = computed<'system' | 'light' | 'dark'>(() => {
      if (preference.value === 'system') {
        return 'system'
      }
      return preference.value === 'dark' ? 'dark' : 'light'
    })

    return {
      tabs: _tabs,
      setActiveTab,
      closeTab,
      openImport,
      openDataTables,
      cycleTheme: cyclePreference,
      themeLabel,
      themeTitle,
      themeIcon,
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
  background: var(--color-toolbar);
  color: var(--color-toolbar-text);
  z-index: 1;
  line-height: 1;
  min-height: 35px;
}

.tab {
  display: flex;
  align-items: center;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
  background: transparent;

  &:hover {
    background: var(--color-toolbar-hover);
  }

  &.active {
    background: var(--color-toolbar-active);

    &:hover {
      background: var(--color-toolbar-hover);
      color: var(--color-toolbar-text);
    }
  }
}

.rightBtn {
  @apply px-2;
  @apply gap-x-1;
  display: flex;
  align-items: center;
  background: transparent;
  border-radius: 0.375rem;
  color: var(--color-toolbar-text);
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }
}

.tabClose {
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-toolbar-text);
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }
}

.themeToggle {
  justify-content: center;
  gap: 0.35rem;

  svg {
    width: 16px;
    height: 16px;
    display: block;
  }
}
</style>
