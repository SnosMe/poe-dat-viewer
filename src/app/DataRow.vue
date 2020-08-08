<template>
  <div class="flex inline no-wrap">
    <div class="viewer-rownum">{{ rowNum }}</div>
    <!-- eslint-disable-next-line vue/require-v-for-key -->
    <div v-for="part in formatted"
      class="viewer-row"
      :class="{
        'viewer-row--border': part.dataStart,
        'viewer-row--selected': part.selected
      }"
      :style="{ width: `calc(var(--ppc) * ${part.width})` }"
      >{{ part.text }}</div>
  </div>
</template>

<script>
import { state } from './viewer/Viewer'
import { formatRow } from './viewer/formatting'

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
  padding: 0 calc(var(--ppc) / 2);
  z-index: -2;
  box-sizing: content-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.viewer-row--border {
    border-left: 1px solid $grey-5;
  }

  &.viewer-row--selected {
    background: $blue-2;
  }

  &:nth-child(2) {
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
