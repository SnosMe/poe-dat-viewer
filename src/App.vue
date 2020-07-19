<template>
  <div id="app">
    <analyze />
  </div>
</template>

<script>
import Analyze from './Analyze'

export default {
  name: 'App',
  components: { Analyze }
}
</script>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: space-between;
}

.layout-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.vue-recycle-scroller__item-wrapper {
  overflow: visible !important;
}

.vue-recycle-scroller__slot {
  position: sticky;
  top: 0;
  z-index: 1;
  @apply shadow;
  display: inline-block;
}

.vue-recycle-scroller.ready.direction-vertical .vue-recycle-scroller__item-view {
  width: auto !important;
}
</style>
