<template>
  <div class="viewer-sticky-head">
    <div class="viewer-col-rownum"
      >{{ ''.padStart(rowNumberLength) }}</div>
    <!-- // -->
    <div style="display: flex; flex-direction: column;">
      <div class="flex inline no-wrap">
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <button v-for="col in headers"
          class="viewer-col viewer-col--border"
          :style="{ width: `${col.length * 3 - 1}ch` }"
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
        >
          <div v-if="col.stats.string"
            class="viewer-col-stat_indicator bg-brown-4"
            style="top: 0ch;" />
          <div v-if="col.stats.array"
            class="viewer-col-stat_indicator bg-teal-4"
            style="top: 1ch;" />
          <div v-if="col.stats.b00"
            class="viewer-col-stat_indicator bg-grey-10"
            style="top: 2ch;" />
          <div v-else-if="col.stats.nullable"
            class="viewer-col-stat_indicator bg-pink-4"
            style="top: 2ch;" />
          <div v-if="col.selected"
            class="viewer-col-stat_indicator bg-grey-10"
            style="top: 0ch; height: 3ch; opacity: 0.25;" />
          <div
            class="viewer-col-stat_max"
            style="top: 0ch; height: 3ch;">{{ col.stats.bMax }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { state } from './viewer/Viewer'
import { toggleColsBetween } from './viewer/selection'

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
  padding: 0 0.5ch;
  text-align: center;
  box-sizing: content-box;
  line-height: 3ch;
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
  width: 3%;
  height: 3ch;
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
  width: 3ch;
  height: 1ch;
  z-index: 1;

  .viewer-col-stat--border:not(:first-child) > & {
    width: calc(3ch + 1px);
    margin-left: -1px;
  }
}

.viewer-col-stat_max {
  visibility: hidden;
  text-align: center;
  cursor: default;
  line-height: 3ch;
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
