<template>
  <div class="inline-flex">
    <div class="whitespace-pre sticky left-0 bg-gray-100 text-blue-600 px-1 border-r">{{ row.rowNum }}</div>
    <!-- eslint-disable-next-line vue/require-v-for-key -->
    <div v-for="part in formatted"
      class="viewer-row"
      :class="{
        'viewer-row-border': part.dataEnd,
        'viewer-row-selected': part.selected
      }"
      >{{ part.text }}</div>
  </div>
</template>

<script>
import { formatRow } from './Viewer'

export default {
  props: ['source', 'format', 'variableData'],
  computed: {
    row () {
      return this.source
    },
    formatted () {
      return formatRow(this.row.data, this.format)
    }
  }
}
</script>

<style lang="postcss">
.viewer-row {
  white-space: pre;
  padding: 0 0.5ch;

  &.viewer-row-border {
    @apply border-r border-red-500;
  }

  &.viewer-row-selected {
    @apply bg-blue-200;
  }

  &:last-child {
    border: none;
  }
}
</style>
