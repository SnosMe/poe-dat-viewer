<template>
  <div class="inline-flex bg-gray-200 shadow relative">
    <div
      class="bg-gray-200 sticky whitespace-pre select-none px-1 mr-px"
      style="z-index: 1; top: 0; left: 0"
      >{{ ''.padStart(rowNumberLength) }}</div>
    <!-- // -->
    <div>
      <div class="inline-flex">
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <button v-for="col in headers"
          class="viewer-col viewer-col-border"
          :style="{ width: `${col.length * 3}ch` }"
          >{{ col.name }}</button>
      </div>
      <div class="inline-flex">
        <button v-for="col in columns" :key="col.offset"
          class="viewer-col"
          :class="{
            'viewer-col-border': col.dataEnd,
            'viewer-col-selected': col.selected
          }"
          style="width: 3ch"
          @mousedown="selectColumn(col.offset, $event)"
          @mouseenter="selectColumn(col.offset, $event)"
          @touchstart="selectColumn(col.offset, $event)"
          @touchmove="selectColumn(col.offset, $event)"
          >{{ col.colNum99 }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { toggleColsBetween } from './Viewer'

export default {
  props: {
    rowNumberLength: {
      type: Number,
      required: true
    },
    headers: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      // selectionStart: 0,
      // colsBeforeSelection: []
    }
  },
  methods: {
    selectStart (offset) {
      this.selectionStart = offset
      this.colsBeforeSelection = Object.freeze(
        JSON.parse(JSON.stringify(this.columns))
      )
      toggleColsBetween(this.columns, this.selectionStart, this.selectionStart)
    },
    selectContinue (offset) {
      this.columns.forEach((col, idx) => {
        col.selected = this.colsBeforeSelection[idx].selected
      })
      toggleColsBetween(this.columns, this.selectionStart, offset)
    },
    selectColumn (offset, e) {
      if (e.type === 'mousedown' || e.type === 'touchstart') {
        this.selectStart(offset)
      } else if (e.type === 'mouseenter' && e.buttons === 1) {
        this.selectContinue(offset)
      } else if (e.type === 'touchmove' && e.changedTouches.length === 1) {
        const el = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        const event = new Event('mouseenter')
        event.buttons = 1
        el.dispatchEvent(event)
      }

      if (e.type === 'touchstart' || e.type === 'touchmove') {
        e.preventDefault()
      }
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

  &.viewer-col-selected {
    @apply bg-blue-500;
    @apply text-blue-100;
  }

  &:last-child {
    border: none;
  }
}
</style>
