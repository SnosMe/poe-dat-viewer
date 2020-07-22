<template>
  <div v-if="!parsed">UPLOAD FILE</div>
  <div v-else class="layout-column">
    <div class="flex justify-between bg-gray-800 text-gray-100 p-2 shadow" style="z-index: 1;">
      <div class="truncate mr-1">{{ parsed.name }}</div>
      <button class="hover:bg-gray-600 rounded px-2">Settings</button>
    </div>
    <div class="flex bg-gray-800 text-gray-100 p-2">
      <template v-if="selections.length === 0">
        <div class="text-gray-500 italic">No bytes selected</div>
      </template>
      <template v-else-if="selections.length === 1">
        <button class="bg-gray-700 hover:bg-gray-600 rounded px-2">Define column</button>
      </template>
      <template v-else-if="selections.length > 1">
        <div class="text-gray-400 pr-1">Selections</div>
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <div v-for="sel in selections"
          class="px-1 mr-1 font-mono bg-gray-200 text-gray-900 rounded"
          >{{ sel }}</div>
      </template>
    </div>
    <div class="flex min-h-0">
      <div class="layout-column min-w-0">
        <virtual-list class="flex-1 font-mono overflow-auto"
          data-key="rowId"
          :data-sources="parsed.rows"
          :data-component="rowComponent"
          :extra-props="{ variableData: parsed.variableData, format: rowFormat }"
          :estimate-size="24"
          :keeps="7"
          header-class="sticky top-0"
          :header-style="{ 'z-index': 1 }">
          <template #header>
            <viewer-head
              :headers="headers"
              :columns="columns"
              :row-number-length="rowNumberLength" />
          </template>
        </virtual-list>
        <div class="bg-gray-800 text-gray-100 p-2 text-sm">
          <div>Made by Alexander Drozdov, v1.0.0 <a class="border-b" href="https://github.com/SnosMe/pogo-analyze-ui">GitHub</a></div>
        </div>
      </div>
      <div class="overflow-y-scroll flex-shrink-0">
        <header-props />
      </div>
    </div>
  </div>
</template>

<script>
import VirtualList from 'vue-virtual-scroll-list'
import { parse } from './file'
import DataRow from './DataRow'
import ViewerHead from './ViewerHead'
import HeaderProps from './HeaderProps'
import { state, importFile, getRowFormating, getColumnSelections, removeHeader } from './Viewer'

export default {
  components: { VirtualList, ViewerHead, HeaderProps },
  created () {
    importFile()
  },
  data () {
    return state
  },
  computed: {
    rowComponent () {
      return DataRow
    },
    rowFormat () {
      return getRowFormating(this.columns)
    },
    selections () {
      return getColumnSelections(this.columns).map(range =>
        range.map(col => col.colNum100).join(' ')
      )
    }
  }
}
</script>
