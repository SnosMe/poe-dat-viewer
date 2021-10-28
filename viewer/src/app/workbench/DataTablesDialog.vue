<template>
  <div class="p-4 overflow-auto border-l flex-1 text-base">
    <button v-if="!isPreloading && !tables.length" class="py-1 px-3 bg-blue-600 text-white hover:bg-blue-800"
      @click="preloadDataTables">Preload Data tables</button>
    <div v-else-if="tables.length !== totalTables" class="flex items-center gap-x-4">
      <i class="codicon codicon-loading animate-spin"></i>
      <div>{{ tables.length }} / {{ totalTables }} tables<span v-if="tables.length">, estimated {{ timeLeft }} sec</span></div>
    </div>
    <table class="border mt-4">
      <thead>
        <tr>
          <th class="border-b px-4">Name</th>
          <th class="border-b px-4">Rows</th>
          <th class="border-b px-8">Valid</th>
          <th class="border-b px-4">More data</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="table of tables" :key="table.name">
          <td class="border-b px-4">{{ table.name }}</td>
          <td class="border-b px-4 text-right">{{ table.totalRows }}</td>
          <td class="border-b px-4 text-center" :class="{ 'bg-red-400': !table.headersValid }">{{ table.headersValid }}</td>
          <td class="border-b px-4 text-center" :class="{ 'bg-yellow-300': table.increasedRowLength }">{{ table.increasedRowLength }}</td>
        </tr>
        <tr v-if="!tables.length">
          <td colspan ="2" class="px-8 py-4">Waiting for preload...</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, shallowRef } from 'vue'
import { preloadDataTables, index } from '../patchcdn/index-store'

const isPreloading = shallowRef(false)
const totalTables = shallowRef(0)
const startedAt = shallowRef(0)
const firstTableAt = shallowRef(0)

export default defineComponent({
  setup () {
    const timeLeft = computed(() => {
      if (!firstTableAt.value && index.value.tableStats.length) {
        firstTableAt.value = Date.now() / 1000
      }
      const now = Date.now() / 1000
      const predicted = (totalTables.value * (now - firstTableAt.value) / index.value!.tableStats.length)
      return Math.max(Math.ceil(predicted - now + firstTableAt.value), 0)
    })

    return {
      timeLeft,
      totalTables,
      isPreloading,
      preloadDataTables: async () => {
        firstTableAt.value = 0
        startedAt.value = Date.now() / 1000
        isPreloading.value = true
        await preloadDataTables(totalTables)
        isPreloading.value = false
      },
      tables: computed(() => index.value.tableStats)
    }
  }
})
</script>
