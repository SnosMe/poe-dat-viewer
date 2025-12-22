<template>
  <div :class="$style.bar">
    <div class="flex">
      <template v-if="selections.length === 0">
        <div class="text-gray-400 italic px-1.5 self-center">No bytes selected</div>
      </template>
      <template v-else-if="selections.length === 1">
        <button :class="$style.actionBtn"
          @click="defineColumn"><i class="codicon codicon-add"></i> Define column</button>
      </template>
      <template v-else-if="selections.length > 1">
        <div class="px-1.5 mr-1 self-center text-muted">Selections</div>
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <div v-for="range in selections"
          :class="$style.selectionTag"
          v-text="range" />
      </template>
    </div>
    <div class="flex gap-x-1">
      <button v-if="rowSorting"
        :class="[$style.actionBtn, $style.secondary]"
        @click="rowSorting = null"
        >Clear sorting</button>
      <button
        :class="$style.actionBtn"
        @click="restoreSchema"
        ><i class="codicon codicon-discard" /> Restore schema</button>
      <button
        :class="$style.actionBtn"
        @click="showSchema"
        ><i class="codicon codicon-json" /> Show schema</button>
      <button
        :class="$style.actionBtn"
        @click="exportDataJson"
        ><i class="codicon codicon-database" /> Export data</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, triggerRef } from 'vue'
import { clearColumnSelection, getColumnSelections } from '../selection.js'
import { createHeaderFromSelected } from '../headers.js'
import FileSaver from 'file-saver'
import { type Viewer, exportAllRows, saveHeaders, removeHeaders, importHeaders } from '../Viewer.js'
import { openTab } from '../../workbench/workbench-core.js'
import ShowSchema from './ShowSchema.vue'
import type { DatSchemasDatabase } from '@/app/dat-viewer/db.js'

export default defineComponent({
  name: 'ViewerActions',
  setup () {
    const viewer = inject<Viewer>('viewer')!
    const db = inject<DatSchemasDatabase>('dat-schemas')!

    const selections = computed(() =>
      getColumnSelections(viewer.columnSelection.value)
        .map(range => range.map(col => String(col)).join(' '))
    )

    function defineColumn () {
      const { editHeader, columnSelection, headers } = viewer
      editHeader.value = createHeaderFromSelected(columnSelection.value, headers.value)
      clearColumnSelection(columnSelection.value)
      triggerRef(headers)
      triggerRef(columnSelection)
      saveHeaders(viewer, db)
    }

    function exportDataJson () {
      const data = exportAllRows(viewer.headers.value, viewer.datFile)
      FileSaver.saveAs(new File(
        [JSON.stringify(data, null, 2)],
        `${viewer.name}.json`,
        { type: 'application/json;charset=utf-8' }
      ))
    }

    function showSchema () {
      openTab({
        id: 'poe-dat-viewer@show-schema',
        title: 'Schema',
        type: ShowSchema,
        args: {
          name: viewer.name,
          headers: JSON.parse(JSON.stringify(viewer.headers.value))
        }
      })
    }

    async function restoreSchema () {
      await removeHeaders(viewer, db)
      await importHeaders(viewer, db)
    }

    return {
      rowSorting: viewer.rowSorting,
      selections,
      defineColumn,
      exportDataJson,
      showSchema,
      restoreSchema
    }
  }
})
</script>

<style lang="postcss" module>
.bar {
  display: flex;
  justify-content: space-between;
  line-height: 1;
  @apply p-2;
  height: 35px;
  background: var(--color-toolbar);
  color: var(--color-toolbar-text-muted);
}

.actionBtn {
  @apply px-1.5;
  @apply flex;
  @apply gap-x-1;
  @apply items-center;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-toolbar-text);
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }
}

.secondary {
  border-color: var(--color-border-strong);
  background: var(--color-surface-elevated);
  color: var(--color-text);

  &:hover {
    background: var(--color-hover-strong);
    color: var(--color-text-inverse);
  }
}

.selectionTag {
  @apply px-1.5;
  @apply mr-1;
  font-family: ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  border-radius: 0.375rem;
  background: var(--color-selection-soft);
  color: var(--color-text);
  display: flex;
  align-items: center;
}
</style>
