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
import type { BundleLoader } from '@/app/patchcdn/cache'

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
  @apply bg-gray-50;
  @apply m-6;
  @apply shadow;
  @apply border;
  @apply text-base;
}
</style>
