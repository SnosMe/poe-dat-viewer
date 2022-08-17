<template>
  <div class="p-4 overflow-auto border-l flex-1 text-base">
    <div class="flex gap-x-4 items-baseline mt-4">
      <div :class="$style.importVariant">1</div>
      <div>
        <div class="max-w-xl mb-4 font-semibold">Useful when a new league is released. While the update is still downloading, you can review files and fix schema directly from the update servers.</div>
        <div class="inline-flex items-baseline pb-2">
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
        <div v-if="latestPoEPatch && poePatch !== latestPoEPatch">
          Latest PoE patch is <code class="px-1 border border-gray-300 rounded">{{ latestPoEPatch }}</code>
        </div>
      </div>
    </div>
    <div class="flex gap-x-4 items-baseline mt-4 border-b pb-3">
      <div :class="$style.importVariant">2</div>
      <div class="flex items-baseline">
        <span class="pr-2">or just</span>
        <label
          class="bg-gray-100 py-1 px-2 cursor-pointer hover:bg-gray-300"
          style="width: 200px"
          for="import-local-file">Pick a local dat file</label>
        <input
          class="hidden"
          id="import-local-file"
          type="file"
          accept=".dat,.dat64"
          @input="handleFile" />
      </div>
    </div>
    <div class="mt-3 flex gap-x-2 items-center">
      <i v-if="isFetchingSchema" class="codicon codicon-loading animate-spin"></i>
      <i v-else class="codicon codicon-check"></i>
      <div>
        <span v-if="isFetchingSchema"> Downloading schema from </span>
        <span v-else> Downloaded schema from </span>
        <a href="https://github.com/poe-tool-dev/dat-schema" class="underline" target="_blank">github.com/poe-tool-dev/dat-schema</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef, computed, inject } from 'vue'
import type { BundleIndex } from '@/app/patchcdn/index-store.js'
import type { DatSchemasDatabase } from '@/app/dat-viewer/db.js'
import { openTab } from './workbench-core.js'
import DatViewer from '../dat-viewer/components/DatViewer.vue'

export default defineComponent({
  setup () {
    const index = inject<BundleIndex>('bundle-index')!
    const db = inject<DatSchemasDatabase>('dat-schemas')!

    const poePatch = shallowRef(localStorage.getItem('POE_PATCH_VER') || '')
    const latestPoEPatch = shallowRef('')

    if (poePatch.value && !index.isLoaded) {
      cdnImport()
    }
    if (!db.isLoaded) {
      db.fetchSchema()
    }
    getLatestPoEPatch()

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
      try {
        await index.loader.setPatch(poePatch.value)
        await index.loadIndex()
        localStorage.setItem('POE_PATCH_VER', poePatch.value)
      } catch (e) {
        window.alert((e as Error).message)
        throw e
      }
    }

    async function getLatestPoEPatch () {
      const res = await fetch('https://raw.githubusercontent.com/poe-tool-dev/latest-patch-version/main/latest.txt')
      const version = await res.text()
      latestPoEPatch.value = version
    }

    return {
      poePatch,
      latestPoEPatch,
      isCdnImportRunning: computed(() => index.loader.progress.value != null),
      isFetchingSchema: computed(() => db.isLoading),
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
    @apply bg-gray-100;
  }
}

.label {
  @apply text-xs;
  @apply px-2;
  @apply text-gray-500;
}

.importVariant {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  @apply bg-gray-700 text-gray-200;
  @apply w-8 h-8;
  @apply rounded;
}
</style>
