<template>
  <div id="app">
    <app-workbench />
  </div>
</template>

<script>
import AppWorkbench from './app/workbench/Workbench'

export default {
  name: 'App',
  components: { AppWorkbench }
}
</script>

<style lang="postcss">
@tailwind base;
@tailwind utilities;
@import "~line-awesome/dist/line-awesome/css/line-awesome.min.css";

* {
  outline: none !important;
}

#app {
  @apply text-sm;
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

.min-h-0 { min-height: 0; }
.min-w-0 { min-width: 0; }
.h-full { height: 100%; }
</style>
