<template>
  <div style="width: 20rem;" class="border-l h-full">
    <div class="bg-gray-200 px-2 shadow font-mono" style="line-height: 3ch;">
      <div>Column properties</div>
      <div class="text-sm font-mono text-gray-600 truncate">{{ header.name || 'unnamed' }}</div>
    </div>
    <div class="p-2">
      <div class="mb-4">
        <label for="h-name" class="mb-1">Name</label>
        <input id="h-name" type="text" v-model="header.name" class="border rounded px-1 w-full" />
      </div>
      <div class="mb-2">
        <div class="mb-1 flex items-baseline justify-between">
          <span>Data type</span>
          <button class="border-b text-gray-600 font-sm leading-tight">clear</button>
        </div>
        <div class="mb-1">
          <button class="bg-gray-300 px-2 rounded">Reference</button> or simple type
        </div>
        <div class="flex">
          <button class="bg-gray-300 hover:bg-gray-400 px-2 rounded-l">Integer</button>
          <button class="bg-gray-300 hover:bg-gray-400 px-2 mx-px">Decimal</button>
          <button class="bg-gray-300 hover:bg-gray-400 px-2 rounded-r">Boolean</button>
        </div>
      </div>
      <div class="flex justify-end mt-8">
        <button class="text-red-600 hover:bg-red-600 hover:text-red-100 hover:border-transparent border border-red-200 px-2 rounded">Remove</button>
      </div>
    </div>
  </div>
</template>

<script>
import { state as Viewer } from './Viewer'

export default {
  computed: {
    header () {
      return Viewer.editHeader
    }
  }
}
</script>
