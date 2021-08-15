<template>
  <div class="p-4 overflow-auto border-l flex-1 text-base">
    <div class="flex space-x-4 items-baseline mt-4">
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
    <div class="flex space-x-4 items-baseline mt-4 border-b pb-3">
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
    <div class="mt-3">
      <template v-if="isFetchingSchema">
        <i class="codicon codicon-loading animate-spin"></i>
        <span> Downloading schema from </span>
      </template>
      <template v-else>
        <i class="codicon codicon-check"></i>
        <span> Downloaded schema from </span>
      </template>
      <a href="https://github.com/poe-tool-dev/dat-schema" class="underline" target="_blank">github.com/poe-tool-dev/dat-schema</a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue'
import { SchemaFile, SCHEMA_VERSION } from 'pathofexile-dat-schema'
import { fetchFile, progress } from '../patchcdn/cache'
import { loadIndex, loadFileContent, index } from '../patchcdn/index-store'
import { publicSchema } from '../dat-viewer/db'
import { openTab } from './workbench-core'
import DatViewer from '../dat-viewer/components/DatViewer.vue'

export default defineComponent({
  setup () {
    const poePatch = shallowRef(localStorage.getItem('POE_PATCH_VER') || '')
    const latestPoEPatch = shallowRef('')
    const isCdnImportRunning = shallowRef(false)
    const isFetchingSchema = shallowRef(false)

    if (poePatch.value && !index.value) {
      cdnImport()
    }
    if (!publicSchema.value.length) {
      fetchSchema()
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

    async function fetchSchema () {
      isFetchingSchema.value = true
      const response = await fetch('https://poe-bundles.snos.workers.dev/schema.min.json')
      const schema: SchemaFile = await response.json()
      if (schema.version === SCHEMA_VERSION) {
        publicSchema.value = schema.tables
      } else {
        console.warn('Latest schema version is not supported.')
      }
      isFetchingSchema.value = false
    }

    async function getLatestPoEPatch () {
      const res = await fetch('https://raw.githubusercontent.com/poe-tool-dev/latest-patch-version/main/latest.txt')
      const version = await res.text()
      latestPoEPatch.value = version
    }

    return {
      poePatch,
      latestPoEPatch,
      isCdnImportRunning,
      isFetchingSchema,
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
