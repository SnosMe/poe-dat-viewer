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
        <div class="inline-flex bg-gray-200 shadow relative">
          <div
            class="bg-gray-200 sticky whitespace-pre select-none px-1 mr-px"
            style="z-index: 1; top: 0; left: 0">{{ ''.padStart(rowNumberLength) }}</div>
          <div>
            <div class="inline-flex">
              <button v-for="(col, idx) in headers" :key="idx"
                class="viewer-col viewer-col-border"
                :style="{ width: `${col.length * 3}ch` }">
                <span>{{ col.name }}</span>
              </button>
            </div>
            <div class="inline-flex">
              <button v-for="col in columns" :key="col.idx"
                class="viewer-col"
                :class="{ 'viewer-col-border': col.dataEnd }"
                style="width: 3ch"
                >
                <!-- <span class="text-center leading-none text-xs">{{ col.idx100 }}</span> -->
                <span>{{ col.idx99 }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </virtual-list>
    <div style="height: 64px;" class="bg-gray-800 text-gray-100">bottom line</div>
  </div>
</template>

<script>
import VirtualList from 'vue-virtual-scroll-list'
import { parse } from './file'
import DataRow from './DataRow'
import { state, importFile, getRowFormating } from './Viewer'

export default {
  components: { VirtualList },
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

<style lang="postcss">
.viewer-col {
  @apply text-gray-600;
  text-align: center;
  box-sizing: content-box;
  height: 3ch;
  line-height: 3ch;
  white-space: nowrap;
  overflow: hidden;

  &.viewer-col-border {
    @apply border-r border-red-500;
  }

  &:hover {
    @apply bg-blue-400;
  }

  &:last-child {
    border: none;
  }
}
</style>
