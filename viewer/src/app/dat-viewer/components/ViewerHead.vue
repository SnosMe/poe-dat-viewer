<template>
  <div class="datv-header-layer">
    <div :style="headersRowStyle" class="absolute">
      <button v-for="col in headers" :key="col.offset"
        class="datv-header" :class="{ 'datv-col--border': col.border }"
        :style="{ width: col.widthPx + 'px', transform: `translate(${col.leftPx}px, 0)` }"
        :title="col.name"
        @click="editHeader(col.offset)">
        <template v-if="col.name === null">&nbsp;</template>
        <span v-else-if="col.name === ''" class="bg-gray-600 text-gray-300 px-1">?</span>
        <template v-else>{{ col.name }}</template>
      </button>
    </div>
    <div :style="colsRowStyle" class="absolute">
      <button v-for="col in columns" :key="col.offset"
        class="datv-byte"
        :class="{
          'datv-col--border': col.border,
          'datv-byte--selected': col.selected
        }"
        :style="{ width: col.widthPx + 'px', transform: `translate(${col.leftPx}px, 0)` }"
        @mousedown="selectStart(col.offset)"
        @mouseenter="selectContinue(col.offset, $event)"
        :title="col.offset"
        v-text="col.text"
      />
    </div>
    <div :style="statsRowStyle" class="absolute datv-stats_row">
      <div v-for="col in columns" :key="col.offset"
        class="datv-stat"
        :class="{
          'datv-col--border': col.border,
          'datv-byte--selected': col.selected
        }"
        :style="{ width: col.widthPx + 'px', transform: `translate(${col.leftPx}px, 0)` }"
      >
        <template v-if="col.stat">
          <div v-if="col.stat.string"
            class="datv-stat__line bg-yellow-600" style="top: 0;" />
          <div v-if="col.stat.array"
            class="datv-stat__line bg-teal-500" style="top: 7px;" />
          <div v-if="col.stat.zero"
            class="datv-stat__line bg-gray-900" style="top: 14px;" />
          <div v-else-if="col.stat.nullable"
            class="datv-stat__line bg-pink-500" style="top: 14px;" />
          <div class="datv-stat__max" v-text="col.stat.max" />
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { toggleColsBetween } from '../selection'
import { sortRows } from '../sorting'
import { defineComponent, inject, shallowRef, shallowReactive, watch, computed, triggerRef } from 'vue'
import { Viewer } from '../Viewer'
import * as rendering from '../rendering'
import { Header } from '../headers'
import { renderHeaderCols } from '../rendering/header-columns'

export default defineComponent({
  props: {
    left: {
      type: Number,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    columns: {
      type: Array,
      required: true
    }
  },
  setup (props) {
    const sortOrder = shallowRef(0)
    let selectionStart = -1
    let colsBeforeSelection = [] as readonly boolean[]

    const viewer = inject<Viewer>('viewer')!

    function selectStart (offset: number) {
      selectionStart = offset
      colsBeforeSelection = [...viewer.columnSelection.value]
      toggleColsBetween(viewer.columnSelection.value, selectionStart, selectionStart, viewer.headers.value)
      triggerRef(viewer.columnSelection)

      document.addEventListener('mouseup', cancelSelection)
      document.addEventListener('mouseleave', cancelSelection)
      function cancelSelection () {
        selectionStart = -1
        document.removeEventListener('mouseup', cancelSelection)
        document.removeEventListener('mouseleave', cancelSelection)
      }
    }

    function selectContinue (offset: number, e: MouseEvent) {
      if (selectionStart === -1 || e.buttons !== 1) return

      const { memsize } = viewer.datFile
      const len = offset - selectionStart
      if (len >= memsize) {
        offset = (selectionStart + memsize * 2) - 1
      } else if (len >= 4) {
        offset = (selectionStart + 8) - 1
      } else if (len >= 2) {
        offset = (selectionStart + 4) - 1
      }
      if (len <= -memsize) {
        offset = (selectionStart - memsize * 2) + 1
      } else if (len <= -4) {
        offset = (selectionStart - 8) + 1
      } else if (len <= -2) {
        offset = (selectionStart - 4) + 1
      }

      viewer.columnSelection.value = [...colsBeforeSelection]
      toggleColsBetween(viewer.columnSelection.value, selectionStart, offset, viewer.headers.value)
    }

    function editHeader (offset: number) {
      const header = viewer.headers.value.find(h => h.offset === offset)!
      if (
        viewer.editHeader.value === header &&
        (!header.type.byteView || header.type.byteView.array)
      ) {
        if (sortOrder.value === 0) {
          sortOrder.value = 1
        } else if (sortOrder.value === 1) {
          sortOrder.value = -1
        } else if (sortOrder.value === -1) {
          sortOrder.value = 1
        }
        viewer.rowSorting.value = sortRows(header, sortOrder.value as 1 | -1, viewer.datFile)
      } else {
        viewer.editHeader.value = header
        sortOrder.value = 0
      }
    }

    const headers = computed(() =>
      renderHeaderCols(viewer.headers.value, props.left, props.left + props.width))

    return {
      headers,
      selectStart,
      selectContinue,
      editHeader,
      headersRowStyle: computed(() =>
        ({ transform: `translate(${-props.left}px, 0)`, lineHeight: rendering.COLUMN_BYTE_HEIGHT + 'px', fontFamily: rendering.FONT_FAMILY, fontSize: rendering.FONT_SIZE + 'px' })),
      colsRowStyle: computed(() =>
        ({ transform: `translate(${-props.left}px, ${rendering.COLUMN_BYTE_HEIGHT}px)`, lineHeight: rendering.COLUMN_BYTE_HEIGHT + 'px', fontFamily: rendering.FONT_FAMILY, fontSize: rendering.FONT_SIZE + 'px' })),
      statsRowStyle: computed(() =>
        ({ transform: `translate(${-props.left}px, ${rendering.COLUMN_BYTE_HEIGHT * 2}px)`, fontFamily: rendering.FONT_FAMILY, fontSize: rendering.FONT_SIZE + 'px' }))
    }
  }
})
</script>

<style lang="postcss">
.datv-col--border {
  @apply border-l border-gray-500;
}

.datv-header {
  @apply text-gray-700;
  position: absolute;
  box-sizing: border-box;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  @apply px-1.5;

  &:hover {
    @apply bg-gray-400;
    @apply text-gray-800;
  }
}

.datv-byte {
  @apply text-gray-700;
  position: absolute;
  box-sizing: content-box;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    @apply bg-blue-400;
    @apply text-white;
  }

  &.datv-byte--selected {
    @apply bg-blue-500;
    @apply text-blue-100;
  }

  &.datv-byte--selected.datv-col--border,
  &.datv-byte--selected + &.datv-col--border {
    @apply border-blue-700;
  }
}

.datv-stat {
  position: absolute;
  box-sizing: content-box;
  text-align: center;
  white-space: nowrap;
  line-height: 21px;
  height: 21px;

  &.datv-byte--selected.datv-col--border,
  &.datv-byte--selected + &.datv-col--border {
    @apply border-gray-500;
  }

  &.datv-byte--selected {
    @apply bg-gray-400;
  }

  .datv-stats_row:hover > & {
    @apply bg-gray-500;
  }
}

.datv-stat__line {
  position: absolute;
  height: 7px;
  width: 100%;

  .datv-col--border > & {
    width: calc(100% + 1px);
    margin-left: -1px;
  }

  .datv-stats_row:hover & {
    --bg-opacity: 0.35;
  }
}

.datv-stat__max {
  visibility: hidden;
  text-align: center;
  cursor: default;
  line-height: 21px;
  width: 100%;
  height: 21px;
  position: absolute;
  top: 0;
  left: 0;
  @apply text-gray-100;
  text-shadow: 0 0 0.5ch rgb(0 0 0 / 70%);

  .datv-stats_row:hover & {
    visibility: visible;
  }
}

.datv-header-layer {
  position: absolute;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  contain: strict;
  @apply bg-gray-200;
}
</style>
