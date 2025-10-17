<template>
  <div v-if="progress" :class="$style.notification">
    <template v-if="progress.totalSize">
      <div class="bg-gray-200 h-1"></div>
      <div class="bg-blue-500 h-1 absolute top-0"
        :style="{ width: `${progress.received/progress.totalSize * 100}%` }"></div>
    </template>
    <div class="p-3">
      <div class="font-semibold truncate">{{ progress.bundleName }}</div>
      <div class="text-grey text-sm">
        <template v-if="progress.totalSize">{{ (progress.totalSize / 1000000).toFixed(1) }} MB</template>
        <template v-else>Downloading...</template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import type { BundleLoader } from '@/app/patchcdn/cache.js'

export default defineComponent({
  setup () {
    const loader = inject<BundleLoader>('bundle-loader')!
    return {
      progress: loader.progress
    }
  }
})
</script>

<style lang="postcss" module>
.notification {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 20rem;
  background: var(--color-surface);
  @apply m-6;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  border: 1px solid var(--color-border);
  @apply text-base;
  color: var(--color-text);

  :global([data-theme="dark"]) & {
    box-shadow: 0 10px 25px rgba(2, 6, 23, 0.4);
  }
}
</style>
