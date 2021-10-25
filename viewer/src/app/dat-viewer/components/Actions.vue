<template>
  <div :class="$style.bar">
    <div class="flex">
      <template v-if="selections.length === 0">
        <div class="text-gray-400 italic px-1.5 self-center">No bytes selected</div>
      </template>
      <template v-else-if="selections.length === 1">
        <button class="hover:bg-gray-300 hover:text-black px-1.5 flex gap-x-1 items-center"
          @click="defineColumn"><i class="codicon codicon-add"></i> Define column</button>
      </template>
      <template v-else-if="selections.length > 1">
        <div class="text-gray-300 px-1.5 mr-1 self-center">Selections</div>
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <div v-for="range in selections"
          class="px-1.5 mr-1 font-mono bg-gray-200 text-black flex items-center"
          v-text="range" />
      </template>
    </div>
    <div class="flex space-x-1">
      <button v-if="rowSorting"
        class="bg-gray-600 hover:bg-gray-300 hover:text-black px-1.5 border border-gray-500"
        @click="rowSorting = null"
        >Clear sorting</button>
      <button
        class="hover:bg-gray-300 hover:text-black px-1.5 flex gap-x-1 items-center"
        @click="restoreSchema"
        ><i class="codicon codicon-discard" /> Restore schema</button>
      <button
        class="hover:bg-gray-300 hover:text-black px-1.5 flex gap-x-1 items-center"
        @click="showSchema"
        ><i class="codicon codicon-json" /> Show schema</button>
      <button
        class="hover:bg-gray-300 hover:text-black px-1.5 flex gap-x-1 items-center"
        @click="exportDataJson"
        ><i class="codicon codicon-database" /> Export data</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, triggerRef } from 'vue'
import { clearColumnSelection, getColumnSelections } from '../selection'
import { createHeaderFromSelected } from '../headers'
import FileSaver from 'file-saver'
import { Viewer, exportAllRows, saveHeaders, removeHeaders, importHeaders } from '../Viewer'
import { openTab } from '../../workbench/workbench-core'
import ShowSchema from './ShowSchema.vue'

export default defineComponent({
  setup () {
    const viewer = inject<Viewer>('viewer')!

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
      saveHeaders(viewer)
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
      await removeHeaders(viewer)
      await importHeaders(viewer)
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
  @apply text-gray-200;
  @apply p-2;
  @apply bg-gray-800;
  height: 35px;
}
</style>
