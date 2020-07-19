<template>
  <div v-if="!parsed">UPLOAD FILE</div>
  <div v-else class="layout-column">
    <div style="height: 64px;" class="bg-gray-800 text-gray-100">Analyze: {{ parsed.name }}</div>
    <virtual-list class="snos-list flex-1 font-mono overflow-auto"
      data-key="rowId"
      :data-sources="parsed.rows"
      :data-component="rowComponent"
      :extra-props="{ variableData: parsed.variableData, headers }"
      :estimate-size="24"
      :keeps="7"
      header-class="sticky top-0"
      :header-style="{ 'z-index': 1 }">
      <template #header>
        <div class="inline-flex bg-gray-200 shadow relative">
          <div
            class="bg-gray-200 sticky whitespace-pre select-none px-1 mr-px"
            style="z-index: 1; top: 0; left: 0">{{ ''.padStart(rowNumberLength) }}</div>
          <button v-for="col in columns" :key="col.idx"
            class="hover:bg-blue-400 flex flex-col text-gray-600"
            style="padding: 0 0.5ch; height: 3ch; line-height: 3ch;">
            <!-- <span class="text-center leading-none text-xs">{{ col.idx100 }}</span> -->
            <span>{{ col.idx99 }}</span>
          </button>
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

export default {
  components: { VirtualList },
  created () {
    const parsed = parse()
    const padLine = String(parsed.rows.length - 1).length
    parsed.rows = parsed.rows.map((data, idx) =>
      ({ rowId: String(idx).padStart(padLine, ' '), data }))
    this.columns = new Array(parsed.rows[0].data.length).fill(undefined)
      .map((_, idx) => {
        return {
          idx,
          idx99: String(idx % 100).padStart(2, '0'),
          idx100: Math.floor(idx / 100)
        }
      })
    console.log(this.columns)
    this.parsed = Object.freeze(parsed)
  },
  data () {
    return {
      headers: [],
      columns: [],
      parsed: null,
      rowIndexing: 0,
      colIndexing: 0
    }
  },
  computed: {
    rowComponent () {
      return DataRow
    },
    rowNumberLength () {
      return String(
        this.parsed.rows.length - 1 + this.rowIndexing
      ).length
    }
  }
}
</script>
