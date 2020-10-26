<template>
  <div class="p-4 overflow-auto">
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
      <button class="ml-1 py-1 px-2 bg-blue-600 text-white hover:bg-blue-800"
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
    <div class="pt-1">
      Or import <button @click="importDemo" class="border-b border-dashed border-blue-500 text-blue-500">demo file</button>
    </div>
  </div>
</template>

<script>
import { importFromFile } from '../dat/dat-file'
import { fetchFile, progress } from '../patchcdn/cache'
import { loadIndex, loadFileContent, index } from '../patchcdn/index-store'
import { DEMO_HDRS } from '../viewer/_demo_data'

export default {
  inject: ['app', 'viewer'],
  data () {
    return {
      poePatch: '',
      isCdnImportRunning: false
    }
  },
  created () {
    this.poePatch = localStorage.getItem('POE_PATCH_VER') || ''
    if (this.poePatch && !index.value) {
      this.cdnImport()
    }
  },
  methods: {
    async handleFile (e) {
      let datFile
      try {
        const fileContent = await e.arrayBuffer()
        const fileName = e.name
        datFile = await importFromFile(fileName, fileContent)
      } catch (e) {
        window.alert(e.message)
        throw e
      }
      await this.viewer.loadDat(datFile)
      this.app.importDialog = false
    },
    async cdnImport () {
      let bundle
      try {
        this.isCdnImportRunning = true
        bundle = await fetchFile(this.poePatch, '_.index.bin')
      } finally {
        this.isCdnImportRunning = false
      }

      try {
        await loadIndex(bundle)
        localStorage.setItem('POE_PATCH_VER', this.poePatch)
      } catch (e) {
        window.alert(e.message)
        throw e
      }
    },
    async importDemo () {
      if (!index.value) {
        this.poePatch = '3.12.2.3.2'
        await this.cdnImport()
      }

      const fileName = 'Data/Russian/BaseItemTypes.dat'
      const fileContent = await loadFileContent(fileName)
      const datFile = await importFromFile(fileName, fileContent)
      await this.viewer.loadDat(datFile, DEMO_HDRS)
      this.app.importDialog = false
    }
  }
}
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
