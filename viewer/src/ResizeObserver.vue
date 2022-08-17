<template>
  <component :is="tag" ref="rootEl" data-role="resize-observer">
    <slot />
  </component>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'

export default defineComponent({
  props: {
    tag: {
      type: String,
      default: 'div'
    }
  },
  emits: ['resize'],
  setup (props, ctx) {
    const rootEl = ref<HTMLElement | null>(null)

    onMounted(() => {
      const resizeObserver = new ResizeObserver(entries => {
        ctx.emit('resize', {
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        })
      })

      resizeObserver.observe(rootEl.value!)
      onBeforeUnmount(() => {
        resizeObserver.unobserve(rootEl.value!)
      })
    })

    return { rootEl }
  }
})
</script>
