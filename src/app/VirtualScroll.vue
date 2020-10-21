<template>
  <div style="position: relative; overflow: auto;"
    @scroll.passive="handleScroll">
    <slot name="header" />
    <slot
      :items="renderItems"
      :top="top"
      :height="height"
      />
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      required: true
    },
    itemHeight: {
      type: Number,
      required: true
    },
    headerHeight: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      top: undefined,
      renderItems: []
    }
  },
  mounted () { this.calculate() },
  watch: {
    items () { this.calculate() }
  },
  computed: {
    height () {
      return this.items.length * this.itemHeight
    }
  },
  methods: {
    calculate () {
      const scrollTop = this.$el.scrollTop

      const count = Math.ceil(this.$el.offsetHeight / this.itemHeight)
      const startIdx = Math.floor(scrollTop / this.itemHeight)

      this.top = (startIdx * this.itemHeight) + this.headerHeight
      this.renderItems = this.items.slice(startIdx, startIdx + count)
    },
    handleScroll (e) {
      if (!this.raf) {
        this.raf = requestAnimationFrame(() => {
          this.calculate()
          this.raf = null
        })
      }
    }
  }
}
</script>
