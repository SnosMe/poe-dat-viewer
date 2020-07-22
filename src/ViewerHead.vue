<template>
  <div class="viewer-sticky-head">
    <div class="viewer-col-rownum"
      >{{ ''.padStart(rowNumberLength) }}</div>
    <!-- // -->
    <div>
      <div class="flex inline no-wrap">
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <button v-for="col in headers"
          class="viewer-col viewer-col-border"
          :style="{ width: `${col.length * 3}ch` }"
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
import { toggleColsBetween, state } from './Viewer'

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
    },
    editHeader (header) {
      state.editHeader = header
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
  padding: 0;
  text-align: center;
  box-sizing: content-box;
  height: 3ch;
  line-height: 3ch;
  white-space: nowrap;
  overflow: hidden;

  &.viewer-col-border {
    border-right: 1px solid $grey-5;
  }

  &:hover {
    background: $blue-4;
    color: $blue-1;
  }

  &.viewer-col-selected {
    background: $blue-6;
    color: $blue-1;
  }

  &.viewer-col-selected.viewer-col-border {
    /* @TODO: &.viewer-col-border ~ &.viewer-col-selected (dataEnd -> dataStart) */
    border-right-color: $blue-8;
  }

  &:last-child {
    border: none;
  }
}

.viewer-col-rownum {
  background: $grey-2;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;
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
