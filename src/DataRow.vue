<template>
  <div class="flex inline no-wrap">
    <div class="viewer-rownum">{{ rowNum }}</div>
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
import { formatRow, state } from './Viewer'

export default {
  props: ['rowIdx', 'format'],
  computed: {
    formatted () {
      return formatRow(this.rowIdx, this.format, state.datFile)
    },
    rowNum () {
      return String(this.rowIdx + state.config.rowNumStart)
        .padStart(state.rowNumberLength, ' ')
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/quasar.variables';

.viewer-row {
  white-space: pre;
  padding: 0 0.5ch;
  z-index: -2;

  &.viewer-row-border {
    border-right: 1px solid $grey-5;
  }

  &.viewer-row-selected {
    background: $blue-2;
  }

  &:last-child {
    border: none;
  }
}

.viewer-rownum {
  white-space: pre;
  position: sticky;
  left: 0;
  z-index: -1;
  padding: 0 0.25rem;
  background: $grey-1;
  color: $blue-8;
  border-right: 1px solid $blue-grey-1;
}
</style>
