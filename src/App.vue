<template>
  <div id="app">
    <analyze />
  </div>
</template>

<script>
import Analyze from './app/Analyze'

export default {
  name: 'App',
  components: { Analyze }
}
</script>

<style lang="scss">
@import '@/styles/quasar.variables';

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

.flex-1 { flex: 1 1 0%; }
.flex-shrink-0 { flex-shrink: 0; }

.min-h-0 { min-height: 0; }
.min-w-0 { min-width: 0; }
.h-full { height: 100%; }

.q-px-px { padding-right: 1px; padding-left: 1px; }
.q-mx-px { margin-right: 1px; margin-left: 1px; }
.q-mr-px { margin-right: 1px; }

.font-sans { font-family: $font-sans; }
.font-mono { font-family: $font-mono; }

.border-b { border-bottom: 1px solid currentColor; }
</style>
