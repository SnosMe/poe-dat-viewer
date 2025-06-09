<template>
  <viewer-actions />
  <div class="flex flex-1">
    <resize-observer @resize="handleResize" class="flex-1 min-h-0 relative">
      <div class="bg-gray-100 absolute" :style="headerBlockStyle">
        <viewer-head :style="headerOverlayContentStyle"
          :left="scrollLeft"
          :width="rowsWidth"
          :columns="renderColumns"
        />
      </div>
      <canvas-scroll
        ref="canvasScroll"
        class="absolute bg-white"
        @scroll="handleScroll"
        :style="scrollableStyle"
        :paint-size="scrollablePaintSize"
        :full-size="scrollableFullSize">
        <canvas ref="canvasRef" @click="handleCanvasClick" />
      </canvas-scroll>
      <div :class="$style.rowsOverlay" :style="rowsOverlayStyle">
        <div class="absolute" :style="{ transform: `translate(0, ${renderItems.top}px)` }">
          <div v-for="(rowIdx, i) in renderItems.ids" :key="rowIdx"
            :style="{ transform: `translate(0, ${i * LINE_HEIGHT}px)`, width: rowsNumberWidth, position: 'absolute' }"
            v-text="rowIdx" />
        </div>
      </div>
    </resize-observer>
    <header-props
      @focus-editing-header="focusEditingHeader" />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType, computed, provide, watch, ref, onMounted, inject, EffectScope } from 'vue'
import ResizeObserver from '@/ResizeObserver.vue'
import CanvasScroll from '@/CanvasScroll.vue'
import { type Viewer, createViewer } from '../Viewer.js'
import ViewerActions from './Actions.vue'
import ViewerHead from './ViewerHead.vue'
import HeaderProps from './HeaderProps.vue'
import * as rendering from '../rendering.js'
import { renderByteCols, renderColStats } from '../rendering/byte-columns.js'
import { renderHeaderCols } from '../rendering/header-columns.js'
import type { BundleIndex } from '@/app/patchcdn/index-store.js'
import type { DatSchemasDatabase } from '@/app/dat-viewer/db.js'

export default defineComponent({
  components: { ResizeObserver, CanvasScroll, ViewerActions, ViewerHead, HeaderProps },
  emits: ['update:kaState'],
  props: {
    args: {
      type: Object as PropType<{
        fileContent: Uint8Array
        fullPath: string
      }>,
      required: true
    },
    kaState: {
      type: Object as PropType<Viewer | undefined>,
      default: undefined
    },
    kaScope: {
      type: Object as PropType<EffectScope>,
      required: true
    }
  },
  setup (props, ctx) {
    const index = inject<BundleIndex>('bundle-index')!
    const db = inject<DatSchemasDatabase>('dat-schemas')!

    let viewer: Viewer
    if (props.kaState) {
      viewer = props.kaState // eslint-disable-line vue/no-setup-props-reactivity-loss
    } else {
      viewer = createViewer(props.args.fullPath, props.args.fileContent, index, db, props.kaScope)
      ctx.emit('update:kaState', viewer)
    }
    provide('viewer', viewer)

    const canvasRef = ref<HTMLCanvasElement | null>(null)

    const canvasScroll = ref<{ scrollTo(x: number | undefined, y: number | undefined): void } | null>(null)
    onMounted(() => {
      canvasScroll.value!.scrollTo(viewer.scrollPos.x, viewer.scrollPos.y)
    })

    const rowIndices = computed(() => {
      if (viewer.rowSorting.value) {
        return viewer.rowSorting.value
      } else {
        return Array.from(
          { length: viewer.datFile.rowCount },
          (_, rowIdx) => rowIdx)
      }
    })

    const paintWidth = ref(0)
    const paintHeight = ref(0)
    function handleResize (sz: { width: number, height: number }) {
      paintWidth.value = sz.width
      paintHeight.value = sz.height
    }
    const { scrollPos } = viewer
    function handleScroll (pos: { y: number, x: number }) {
      scrollPos.x = pos.x
      scrollPos.y = pos.y
    }

    const rowsFullWidth = computed(() =>
      rendering.getRowWidth(viewer.headers.value))
    const rowsFullHeight = computed(() =>
      viewer.datFile.rowCount * rendering.LINE_HEIGHT)
    const rowsOverlayWidth = computed(() =>
      rendering.rowsOverlayWidth(viewer.datFile.rowCount))
    const rowsWidth = computed(() =>
      Math.max(0, paintWidth.value - rowsOverlayWidth.value))
    const rowsHeight = computed(() =>
      Math.max(0, paintHeight.value - rendering.HEADERS_HEIGHT))

    watch([rowsWidth, rowsHeight], () => {
      const dpr = window.devicePixelRatio

      canvasRef.value!.style.width = rowsWidth.value + 'px'
      canvasRef.value!.style.height = rowsHeight.value + 'px'

      canvasRef.value!.width = rowsWidth.value * dpr
      canvasRef.value!.height = rowsHeight.value * dpr

      const ctx = canvasRef.value!.getContext('2d', { alpha: false })!
      ctx.scale(dpr, dpr)

      draw()
    })

    const renderStats = computed(() =>
      renderColStats(viewer.columnStats.value, viewer.datFile))

    const renderColumns = computed(() =>
      renderByteCols(
        viewer.columnSelection.value,
        renderStats.value,
        viewer.headers.value,
        scrollPos.x,
        scrollPos.x + Math.min(rowsFullWidth.value, rowsWidth.value))
    )

    const tablesLoadWatcher = computed(() => {
      for (const entry of viewer.referencedTables.value.values()) {
        // eslint-disable-next-line no-void
        void entry.value // vue-reactivity: subscribe
      }
      return undefined
    })

    watch([scrollPos, renderColumns, rowIndices, viewer.selectedRow, tablesLoadWatcher], () => { draw() })

    function draw () {
      const ctx = canvasRef.value!.getContext('2d', { alpha: false })!

      rendering.drawRows({
        left: scrollPos.x,
        paintWidth: rowsWidth.value,
        top: renderItems.value.top,
        rows: renderItems.value.ids,
        columns: renderColumns.value,
        viewer,
        ctx
      })
    }

    const renderItems = computed(() => {
      const scrollTop = scrollPos.y

      const count = Math.ceil(rowsHeight.value / rendering.LINE_HEIGHT) + 1
      const startIdx = Math.floor(scrollTop / rendering.LINE_HEIGHT)

      const top = (startIdx * rendering.LINE_HEIGHT) - scrollTop

      return {
        top,
        ids: rowIndices.value.slice(startIdx, startIdx + count)
      }
    })

    function focusEditingHeader () {
      const header = viewer.editHeader.value!
      const cols = renderHeaderCols(viewer.headers.value, null, 0, 0 + Infinity)
      const target = cols.find(col => col.offset === header.offset)!
      canvasScroll.value!.scrollTo(target.leftPx - rowsWidth.value * 0.33, undefined)
    }

    function handleCanvasClick (e: MouseEvent) {
      const { selectedRow } = viewer
      const sortedIdx = Math.floor((e.offsetY + scrollPos.y) / rendering.LINE_HEIGHT)
      const realIdx = rowIndices.value[sortedIdx]
      selectedRow.value = (selectedRow.value !== realIdx)
        ? realIdx
        : null
    }

    return {
      headerBlockStyle: computed(() =>
        ({ height: rendering.HEADERS_HEIGHT + 'px', width: paintWidth.value + 'px' })),
      headerOverlayContentStyle: computed(() =>
        ({ left: rowsOverlayWidth.value + 'px', height: rendering.HEADERS_HEIGHT + 'px', width: rowsWidth.value + 'px' })),
      scrollableStyle: computed(() =>
        ({ top: rendering.HEADERS_HEIGHT + 'px', left: rowsOverlayWidth.value + 'px' })),
      scrollablePaintSize: computed(() =>
        ({ width: rowsWidth.value, height: rowsHeight.value })),
      scrollableFullSize: computed(() =>
        ({ width: rowsFullWidth.value, height: rowsFullHeight.value })),
      rowsOverlayStyle: computed(() =>
        ({ top: rendering.HEADERS_HEIGHT + 'px', width: rowsOverlayWidth.value + 'px', height: rowsHeight.value + 'px', fontFamily: rendering.FONT_FAMILY, fontSize: rendering.FONT_SIZE + 'px', lineHeight: rendering.LINE_HEIGHT + 'px' })),
      handleScroll,
      handleResize,
      renderItems,
      canvasRef,
      renderColumns,
      scrollLeft: computed(() => scrollPos.x),
      rowsWidth: computed(() => Math.min(rowsFullWidth.value, rowsWidth.value)),
      LINE_HEIGHT: rendering.LINE_HEIGHT,
      canvasScroll,
      rowsNumberWidth: (rendering.rowsNumWidth(viewer.datFile.rowCount) + 'px'),
      focusEditingHeader,
      handleCanvasClick
    }
  }
})
</script>

<style lang="postcss" module>
.rowsOverlay {
  position: absolute;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  contain: strict;
  @apply bg-white;
  padding-left: 7px;
  @apply border-l border-gray-100;
  padding-right: 8px;
  text-align: right;
  box-shadow: #cacaca 0 6px 6px -6px inset;
  user-select: none;
}
</style>
