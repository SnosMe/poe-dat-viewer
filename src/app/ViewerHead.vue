<template>
  <div class="viewer-sticky-head">
    <div class="viewer-col-rownum"
      >{{ ''.padStart(viewer.rowNumberLength) }}</div>
    <!-- // -->
    <div style="display: flex; flex-direction: column;">
      <div class="flex inline no-wrap">
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <button v-for="col in headers"
          class="viewer-col viewer-col--border"
          :style="{ width: calcHeaderWidth(col) }"
          @click="editHeader(col)">
          <span v-if="col.name === null">{{ '\u00a0' }}</span>
          <span v-else-if="col.name === ''" class="bg-blue-grey-6 text-grey-2 rounded-borders q-px-px">?</span>
          <template v-else>{{ col.name }}</template>
        </button>
      </div>
      <div class="flex inline no-wrap">
        <button v-for="col in columns" :key="col.offset"
          class="viewer-col"
          :class="{
            'viewer-col--border': col.dataStart,
            'viewer-col--selected': col.selected
          }"
          :style="{ width: `calc(var(--ppc) * ${col.header ? col.header.cachedView.length : 2})` }"
          @mousedown="selectColumn(col.offset, $event)"
          @mouseenter="selectColumn(col.offset, $event)"
          @touchstart="selectColumn(col.offset, $event)"
          @touchmove="selectColumn(col.offset, $event)"
          >{{ col.colNum99 }}</button>
      </div>
      <div class="flex inline no-wrap">
        <div v-for="col in columns" :key="col.offset"
          class="viewer-col-stat"
          :class="{
            'viewer-col-stat--border': col.dataStart,
            'viewer-col-stat--selected': col.selected
          }"
          :style="{ width: `calc(var(--ppc) * ${col.header ? col.header.cachedView.length + 1 : 3})` }"
        >
          <template v-if="!col.header">
            <div v-if="col.stats.string"
              class="viewer-col-stat_indicator bg-brown-4"
              style="top: 0;" />
            <div v-if="col.stats.array"
              class="viewer-col-stat_indicator bg-teal-4"
              style="top: var(--ppc);" />
            <div v-if="col.stats.b00"
              class="viewer-col-stat_indicator bg-grey-10"
              style="top: calc(var(--ppc) * 2);" />
            <div v-else-if="col.stats.nullable"
              class="viewer-col-stat_indicator bg-pink-4"
              style="top: calc(var(--ppc) * 2);" />
            <div v-if="col.selected"
              class="viewer-col-stat_indicator bg-grey-10"
              style="top: 0; height: calc(var(--ppc) * 3); opacity: 0.25;" />
            <div
              class="viewer-col-stat_max"
              style="top: 0; height: calc(var(--ppc) * 3);">{{ col.stats.bMax }}</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { toggleColsBetween } from './viewer/selection'
import { sortRows } from './viewer/sorting'

export default {
  props: {
    headers: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    }
  },
  inject: ['viewer'],
  data () {
    return {
      sortOrder: 0
      // this.selectionStart: 0,
      // this.colsBeforeSelection: []
    }
  },
  methods: {
    selectStart (offset) {
      this.selectionStart = offset
      this.colsBeforeSelection = Object.freeze(
        this.columns.map(col => ({ selected: col.selected }))
      )
      toggleColsBetween(this.columns, this.selectionStart, this.selectionStart)
    },
    selectContinue (offset) {
      if (this.selectionStart === undefined) return

      const { memsize } = this.viewer.datFile
      const len = offset - this.selectionStart
      if (len >= memsize) {
        offset = this.selectionStart + (memsize * 2 - 1)
      } else if (len >= 4) {
        offset = this.selectionStart + 7
      } else if (len >= 2) {
        offset = this.selectionStart + 3
      }
      if (len <= -memsize) {
        offset = this.selectionStart - (memsize * 2 - 1)
      } else if (len <= -4) {
        offset = this.selectionStart - 7
      } else if (len <= -2) {
        offset = this.selectionStart - 3
      }

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
    },
    editHeader (header) {
      if (
        this.viewer.editHeader === header &&
        header.cachedView &&
        !header.type.byteView
      ) {
        if (this.sortOrder === 0) {
          this.sortOrder = 1
        } else if (this.sortOrder === 1) {
          this.sortOrder = -1
        } else if (this.sortOrder === -1) {
          this.sortOrder = 1
        }
        const rows = sortRows(header, this.sortOrder)
        this.viewer.rowSorting = Object.freeze(rows)
      } else {
        this.viewer.editHeader = header
        this.sortOrder = 0
      }
    },
    calcHeaderWidth (header) {
      const width = header.type.byteView
        ? header.length * 3 - 1
        : header.cachedView.length
      return `calc(var(--ppc) * ${width})`
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/quasar.variables';

.viewer-col {
  color: $blue-grey-6;
  background: $grey-2;
  border: none;
  cursor: pointer;
  padding: 0 calc(var(--ppc) / 2);
  text-align: center;
  box-sizing: content-box;
  line-height: calc(var(--ppc) * 3);
  white-space: nowrap;
  overflow: hidden;

  &.viewer-col--border {
    border-left: 1px solid $grey-5;
  }

  &:hover {
    background: $blue-4;
    color: $blue-1;
  }

  &.viewer-col--selected {
    background: $blue-6;
    color: $blue-1;
  }

  &.viewer-col--selected.viewer-col--border,
  &.viewer-col--selected + &.viewer-col--border {
    border-left-color: $blue-8;
  }

  &:first-child { border: none; }
  &:focus { outline: 0; }
}

.viewer-col-stat {
  color: $blue-grey-6;
  background: $grey-2;
  box-sizing: content-box;
  height: calc(var(--ppc) * 3);
  position: relative;

  &.viewer-col-stat--border {
    border-left: 1px solid $grey-5;
  }

  &.viewer-col-stat--selected + &.viewer-col-stat--border {
    border-left-color: $grey-6;
  }
  &.viewer-col-stat--selected.viewer-col-stat--border {
    border-left-color: $grey-5;
  }

  &:first-child { border: none; }
}

.viewer-col-stat_indicator {
  position: absolute;
  width: calc(var(--ppc) * 3);
  height: var(--ppc);
  z-index: 1;

  .viewer-col-stat--border:not(:first-child) > & {
    width: calc(var(--ppc) * 3 + 1px);
    margin-left: -1px;
  }
}

.viewer-col-stat_max {
  visibility: hidden;
  text-align: center;
  cursor: default;
  line-height: calc(var(--ppc) * 3);
  z-index: 1;
  position: relative;
  color: $grey-1;
  text-shadow: 0 0 0.5ch rgba(0,0,0,0.7);
  background: #757575b0;

  div:hover > .viewer-col-stat > & {
    visibility: visible;
  }
}

.viewer-col-rownum {
  background: $grey-2;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 2;
  user-select: none;
  white-space: pre;
  padding: 0 0.25rem;
  margin-right: 1px;
}

.viewer-sticky-head {
  display: inline-flex;
  background: $grey-2;
  box-shadow: $shadow-1;
  position: sticky;
  top: 0;
}
</style>
