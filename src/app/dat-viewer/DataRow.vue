<template>
  <div class="flex no-wrap">
    <div class="viewer-rownum">{{ rowNum }}</div>
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
      return formatRow(this.rowIdx, this.format, this.viewer.datFile)
    },
    rowNum () {
      return String(this.rowIdx + settings.rowNumStart)
        .padStart(this.viewer.rowNumberLength, ' ')
    }
  }
}
</script>

<style lang="postcss">
.viewer-row {
  white-space: pre;
  padding: 0 calc(var(--ppc) / 2);
  box-sizing: content-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.viewer-row--border {
  }

  &.viewer-row--selected {
  }

  &:nth-child(2) {
    border: none;
  }
}

.viewer-rownum {
  white-space: pre;
  position: sticky;
  left: 0;
  padding: 0 0.25rem;
}
</style>
