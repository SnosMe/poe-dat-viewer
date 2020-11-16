<template>
  <div class="flex no-wrap">
    <!-- eslint-disable-next-line vue/require-v-for-key -->
    <div v-for="part in formatted"
      class="viewer-row"
      :class="{
        'viewer-row--border': part.dataStart,
        'viewer-row--selected': part.selected,
        'text-grey-7': part.color === 1,
        'text-green-9': part.color === 2,
        'text-indigo-14': part.color === 3
      }"
      :style="{ width: `calc(var(--ppc) * ${part.width})` }"
      >{{ part.text }}</div>
  </div>
</template>

<script>
import { formatRow } from '../viewer/formatting'
import { settings } from '@/app/workbench/workbench-core'

export default {
  props: ['rowIdx', 'format'],
  inject: ['viewer'],
  computed: {
    formatted () {
      return formatRow(this.rowIdx, this.format, this.viewer.value.datFile)
    }
  }
}
</script>

<style lang="postcss">
.viewer-row {
  padding: 0 calc(var(--ppc) / 2);
  box-sizing: content-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.viewer-row--border {
    @apply border-l border-gray-500;
  }

  &.viewer-row--selected {
    @apply bg-blue-200;
  }

  &:nth-child(2) {
    border: none;
  }
}

.viewer-rownum {
  padding: 0 8px;
  text-align: right;
}
</style>
