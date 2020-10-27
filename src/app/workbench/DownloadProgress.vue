<template>
  <div v-if="active" :class="$style.notification">
    <template v-if="totalSize">
      <div class="bg-gray-300 h-1"></div>
      <div class="bg-blue-500 h-1 absolute top-0"
        :style="{ width: `${received/totalSize * 100}%` }"></div>
    </template>
    <div class="p-3">
      <div class="font-semibold truncate">{{ bundleName }}</div>
      <div class="text-grey text-sm">
        <template v-if="totalSize">{{ (totalSize / 1000000).toFixed(1) }} MB</template>
        <template v-else>Downloading...</template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { progress } from '../patchcdn/cache'

export default defineComponent({
  setup () {
    return progress
  }
})
</script>

<style lang="postcss" module>
.notification {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 20rem;
  @apply bg-gray-100;
  @apply m-6;
  @apply shadow;
  @apply border;
  @apply text-base;
}
</style>
