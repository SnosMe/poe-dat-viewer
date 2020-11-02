<template>
  <div :class="$style.scrollable"
    :style="{ width: paintSize.width + 'px', height: paintSize.height + 'px' }"
    @mousedown="handleMousedown"
    @wheel="handleMousewheel"
  >
    <slot />
    <div v-if="scrollbarY" :class="`${$style.track} ${$style.y}`" @mousedown="handleTrackMousedownY"
      :style="{ width: scrollbarY.fixedSize + 'px', height: scrollbarY.trackSize + 'px' }">
      <div :class="$style.thumb" :style="{
        transform: `translate(0, ${scrollbarY.thumbPos}px)`,
        width: scrollbarY.fixedSize + 'px', height: scrollbarY.thumbSize + 'px' }" />
    </div>
    <div v-if="scrollbarX" :class="`${$style.track} ${$style.x}`" @mousedown="handleTrackMousedownX"
      :style="{ width: scrollbarX.trackSize + 'px', height: scrollbarX.fixedSize + 'px' }">
      <div :class="$style.thumb" :style="{
        transform: `translate(${scrollbarX.thumbPos}px, 0)`,
        width: scrollbarX.thumbSize + 'px', height: scrollbarX.fixedSize + 'px' }" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowReactive, computed, Ref, PropType, readonly, watch } from 'vue'

const MIN_THUMB_SIZE = 40
const SCROLL_DIR_THRESHOLD = 15
const WHEEL_SCROLL_SPEED = 100
// @TODO: may actually look better without delta time?
const SCROLL_ACCELERATION_FN = (value: number, dt: number) =>
  Math.max(1, Math.pow(value * (3 / 1000) * dt, 2)) * Math.sign(value)

type Scrollbar = {
  fixedSize: number
  trackSize: number
  thumbSize: number
  thumbRatio: number
  thumbPos: number
} | null

function scrollbar (
  fixedSize: number,
  paintSize: number,
  scrollSize: number,
  otherScrollbar: Scrollbar,
  scrollPos: number
): Scrollbar {
  if (scrollSize <= paintSize) return null

  const trackSize = Math.max(0, paintSize - (otherScrollbar?.fixedSize ?? 0))
  const thumbSize = Math.max(MIN_THUMB_SIZE, Math.floor(paintSize * trackSize / scrollSize))

  const thumbRatio = (trackSize - thumbSize) / (scrollSize - paintSize)
  const thumbPos = Math.round(scrollPos * thumbRatio)

  return {
    trackSize,
    thumbSize,
    fixedSize,
    thumbRatio,
    thumbPos
  }
}

function useMouseMiddleButtonScroll (scrollByDelta: (dx: number, dy: number) => void) {
  let startY = 0
  let startX = 0
  let deltaY = 0
  let deltaX = 0
  let direction = null as 'vertical' | 'horizontal' | null

  let rafTime = 0
  let rafId = 0

  function handleMousedown (e: MouseEvent) {
    if (e.button !== 1) return

    e.preventDefault()
    e.stopPropagation()
    document.body.style.cursor = 'all-scroll'

    direction = null
    startY = e.clientY
    startX = e.clientX
    deltaY = 0
    deltaX = 0

    rafTime = 0
    rafId = requestAnimationFrame(scrollEachFrame)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', cancelScroll)
    document.addEventListener('mouseleave', cancelScroll)
  }

  function cancelScroll () {
    cancelAnimationFrame(rafId)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', cancelScroll)
    document.removeEventListener('mouseleave', cancelScroll)

    document.body.style.removeProperty('cursor')
  }

  function handleMouseMove (e: MouseEvent) {
    const dy = (e.clientY - startY)
    const dx = (e.clientX - startX)

    if (direction === null) {
      if (Math.abs(dy) > SCROLL_DIR_THRESHOLD) {
        direction = 'vertical'
        document.body.style.cursor = 'ns-resize'
      } else if (Math.abs(dx) > SCROLL_DIR_THRESHOLD) {
        direction = 'horizontal'
        document.body.style.cursor = 'ew-resize'
      } else {
        return
      }
    }

    if (direction === 'vertical') {
      deltaY = dy
    } else {
      deltaX = dx
    }
  }

  function scrollEachFrame (time: number) {
    const dtTime = time - (rafTime || time)
    rafTime = time
    rafId = requestAnimationFrame(scrollEachFrame)

    scrollByDelta(
      SCROLL_ACCELERATION_FN(deltaX, dtTime),
      SCROLL_ACCELERATION_FN(deltaY, dtTime)
    )
  }

  return { handleMousedown }
}

function useMouseWheelScroll (scrollByDelta: (dx: number, dy: number) => void) {
  function handleMousewheel (e: WheelEvent) {
    scrollByDelta(0, Math.sign(e.deltaY) * WHEEL_SCROLL_SPEED)
  }

  return { handleMousewheel }
}

function useScrollbarScroll (
  scrollbar: Ref<Scrollbar>,
  axis: 'x' | 'y',
  scrollTo: (x: number | undefined, y: number | undefined) => void
) {
  let start = 0
  let offset = 0

  const rectProp = (axis === 'y' ? 'y' : 'x')
  const mEventProp = (axis === 'y' ? 'clientY' : 'clientX')

  function handleTrackMousedown (e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const trackEl = e.currentTarget as HTMLElement
    start = trackEl.getBoundingClientRect()[rectProp]

    if (e.target !== trackEl) {
      const thumbEl = e.target as HTMLElement
      offset = e[mEventProp] - thumbEl.getBoundingClientRect()[rectProp]
    } else {
      offset = (scrollbar.value!.thumbSize / 2)
      handleMouseMove(e)
      offset = (e[mEventProp] - start - scrollbar.value!.thumbPos)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', cancelScroll)
    document.addEventListener('mouseleave', cancelScroll)
  }

  function handleMouseMove (e: MouseEvent) {
    const value = (e[mEventProp] - start - offset) / scrollbar.value!.thumbRatio
    if (axis === 'x') {
      scrollTo(value, undefined)
    } else {
      scrollTo(undefined, value)
    }
  }

  function cancelScroll () {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', cancelScroll)
    document.removeEventListener('mouseleave', cancelScroll)
  }

  return { handleTrackMousedown }
}

export default defineComponent({
  props: {
    paintSize: {
      type: Object as PropType<{ width: number, height: number }>,
      required: true
    },
    fullSize: {
      type: Object as PropType<{ width: number, height: number }>,
      required: true
    },
    widthY: {
      type: Number,
      default: 14
    },
    widthX: {
      type: Number,
      default: 12
    }
  },
  emits: ['scroll'],
  setup (props, ctx) {
    const scrollPos = shallowReactive({ y: 0, x: 0 })

    watch(() => [props.paintSize, props.fullSize], () => {
      const { paintSize, fullSize } = props
      scrollPos.x = Math.max(0, Math.min(scrollPos.x, fullSize.width - paintSize.width))
      scrollPos.y = Math.max(0, Math.min(scrollPos.y, fullSize.height - paintSize.height))
    }, { deep: true })

    watch(scrollPos, () => {
      ctx.emit('scroll', {
        y: scrollPos.y,
        x: scrollPos.x
      })
    })

    const scrollbarY = computed(() =>
      scrollbar(props.widthY, props.paintSize.height, props.fullSize.height, null, scrollPos.y))
    const scrollbarX = computed(() =>
      scrollbar(props.widthX, props.paintSize.width, props.fullSize.width, scrollbarY.value, scrollPos.x))

    function scrollByDelta (dx: number, dy: number) {
      const { paintSize, fullSize } = props
      scrollPos.y = Math.max(0, Math.min(scrollPos.y + Math.floor(dy), fullSize.height - paintSize.height))
      scrollPos.x = Math.max(0, Math.min(scrollPos.x + Math.floor(dx), fullSize.width - paintSize.width))
    }

    function scrollTo (x: number | undefined, y: number | undefined) {
      const { paintSize, fullSize } = props
      if (x !== undefined) {
        scrollPos.x = Math.max(0, Math.min(Math.floor(x), fullSize.width - paintSize.width))
      }
      if (y !== undefined) {
        scrollPos.y = Math.max(0, Math.min(Math.floor(y), fullSize.height - paintSize.height))
      }
    }

    return {
      scrollbarY,
      scrollbarX,
      scrollPos: readonly(scrollPos),
      scrollTo,
      scrollByDelta,
      handleMousedown: useMouseMiddleButtonScroll(scrollByDelta).handleMousedown,
      handleMousewheel: useMouseWheelScroll(scrollByDelta).handleMousewheel,
      handleTrackMousedownY: useScrollbarScroll(scrollbarY, 'y', scrollTo).handleTrackMousedown,
      handleTrackMousedownX: useScrollbarScroll(scrollbarX, 'x', scrollTo).handleTrackMousedown
    }
  }
})
</script>

<style lang="postcss" module>
.scrollable {
  overflow: hidden;
  position: relative;
  transform: translate3d(0, 0, 0);
}

.track {
  position: absolute;
  contain: strict;
  &.y { top: 0; right: 0; }
  &.x { bottom: 0; left: 0; }
}

.thumb {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.3);
  will-change: transform;

  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>
