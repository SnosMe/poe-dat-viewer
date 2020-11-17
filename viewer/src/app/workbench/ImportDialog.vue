<template>
  <div class="p-4 overflow-auto border-l flex-1 text-base">
    <div class="inline-flex items-baseline border-b pb-2">
      <div style="width: 200px;" class="my-1">
        <input value="patchcdn.pathofexile.com/" readonly :class="$style.input" />
        <label :class="$style.label">Patch CDN</label>
      </div>
      <div style="width: 100px;" class="m-1">
        <input v-model.trim="poePatch" placeholder="3.12.x.x.x" :class="$style.input" />
        <label :class="$style.label">Patch #</label>
      </div>
      <div style="width: 220px;" class="my-1">
        <input value="/Bundles2/_.index.bin" readonly :class="$style.input" />
        <label :class="$style.label">Index</label>
      </div>
      <button class="ml-1 py-1 px-3 bg-blue-600 text-white hover:bg-blue-800"
        @click="cdnImport"
        :disabled="isCdnImportRunning"
        :loading="isCdnImportRunning">{{ isCdnImportRunning ? 'Wait...' : 'Import' }}</button>
    </div>
    <div class="flex items-baseline mt-3">
      <label
        class="bg-gray-200 py-1 px-2 cursor-pointer hover:bg-gray-400"
        style="width: 250px"
        for="import-local-file">Pick local file</label>
      <input
        class="hidden"
        id="import-local-file"
        type="file"
        accept=".dat,.dat64"
        @input="handleFile" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { fetchFile, progress } from '../patchcdn/cache'
import { loadIndex, loadFileContent, index } from '../patchcdn/index-store'
import { openTab } from './workbench-core'
import DatViewer from '../dat-viewer/components/DatViewer.vue'

export default defineComponent({
  setup () {
    const poePatch = ref(localStorage.getItem('POE_PATCH_VER') || '')
    const isCdnImportRunning = ref(false)

    if (poePatch.value && !index.value) {
      cdnImport()
    }

    async function handleFile (e: Event) {
      const elFile = (e.target as HTMLInputElement).files![0]
      const fileContent = new Uint8Array(await elFile.arrayBuffer())
      const fileName = elFile.name
      openTab({
        id: `file@${fileName}`,
        title: fileName,
        type: DatViewer,
        args: {
          fileContent,
          fullPath: fileName
        }
      })
    }

    async function cdnImport () {
      let bundle
      try {
        isCdnImportRunning.value = true
        bundle = await fetchFile(poePatch.value, '_.index.bin')
      } finally {
        isCdnImportRunning.value = false
      }

      try {
        await loadIndex(bundle)
        localStorage.setItem('POE_PATCH_VER', poePatch.value)
      } catch (e) {
        window.alert(e.message)
        throw e
      }
    }

    return {
      poePatch,
      isCdnImportRunning,
      handleFile,
      cdnImport
    }
  }
})
</script>

<style lang="postcss" module>
.input {
  width: 100%;
  @apply py-1 px-2;

  &:not([readonly]) {
    @apply border;

    &:focus {
      @apply border-blue-500;
    }
  }

  &[readonly] {
    @apply border-b;
    @apply bg-gray-200;
  }
}

.label {
  @apply text-xs;
  @apply px-2;
  @apply text-gray-600;
}
</style>
