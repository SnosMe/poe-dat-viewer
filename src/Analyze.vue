<template>
  <div v-if="!parsed">UPLOAD FILE</div>
  <div v-else class="layout-column">
    <div style="height: 64px;" class="bg-gray-800 text-gray-100">Analyze: {{ parsed.name }}</div>
    <virtual-list class="snos-list flex-1 font-mono overflow-auto"
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
    <div style="height: 64px;" class="bg-gray-800 text-gray-100">
      <div>Controls</div>
      <div>Alexander Drozdov, v1.0.0</div>
    </div>
  </div>
</template>

<script>
import VirtualList from 'vue-virtual-scroll-list'
import { parse } from './file'
import DataRow from './DataRow'
import ViewerHead from './ViewerHead'
import { state, importFile, getRowFormating } from './Viewer'

export default {
  components: { VirtualList, ViewerHead },
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
    }
  }
}
</script>
