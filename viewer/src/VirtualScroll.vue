<template>
  <resize-observer @resize="handleResize" class="relative">
    <canvas-scroll ref="scrollable"
      v-bind="scrollableProps"
      class="absolute"
      :paint-size="paintSize"
      :full-size="fullSize"
    >
      <slot :entries="renderItems" />
    </canvas-scroll>
  </resize-observer>
</template>

<script lang="ts">
import { defineComponent, computed, shallowReactive, ref, PropType } from 'vue'
import ResizeObserver from './ResizeObserver.vue'
import CanvasScroll from './CanvasScroll.vue'

class VirtualScrollFactory<T = unknown> {
  define () {
    return defineComponent({
      components: { ResizeObserver, CanvasScroll },
      props: {
        items: {
          type: Array as PropType<T[]>,
          required: true
        },
        itemHeight: {
          type: Number,
          required: true
        },
        scrollableProps: {
          type: Object,
          default: () => ({})
        }
      },
      setup (props) {
        const paintSize = shallowReactive({
          width: 0,
          height: 0
        })

        const fullSize = computed(() => ({
          width: paintSize.width,
          height: props.items.length * props.itemHeight
        }))

        function handleResize (sz: { width: number, height: number }) {
          paintSize.width = sz.width
          paintSize.height = sz.height
        }

        const scrollable = ref<{ scrollPos: { y: number } } | null>(null)

        const renderItems = computed(() => {
          const scrollTop = (scrollable.value?.scrollPos.y ?? 0)

          const count = Math.ceil(paintSize.height / props.itemHeight) + 1
          const startIdx = Math.floor(scrollTop / props.itemHeight)

          const top = (startIdx * props.itemHeight) - scrollTop

          return props.items
            .slice(startIdx, startIdx + count)
            .map((item, i) =>
              ({
                top: top + (i * props.itemHeight),
                item
              })
            )
        })

        return {
          handleResize,
          paintSize,
          fullSize,
          scrollable,
          renderItems
        }
      }
    })
  }
}

const singleton = new VirtualScrollFactory().define()

export function VirtualScroll<T> () {
  return singleton as ReturnType<VirtualScrollFactory<T>['define']>
}

export default singleton
</script>
