<template>
  <q-card style="max-width: 80vw;">
    <q-card-section>
      <div class="q-gutter-xs flex items-baseline">
        <q-input value="patchcdn.pathofexile.com/" filled hint="Patch CDN" readonly dense style="width: 200px;" />
        <q-input v-model.trim="poePatch" filled hint="Patch #" dense placeholder="3.12.x.x.x" style="width: 100px;" />
        <q-input value="/Bundles2/_.index.bin" filled hint="Index" readonly dense style="width: 250px;" />
        <q-btn label="Import" color="primary" @click="cdnImport" :loading="isCdnImportRunning" />
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <div class="flex items-baseline">
        <q-file
          label="Pick local file"
          accept=".dat,.dat64"
          filled dense
          style="max-width: 250px"
          @input="handleFile"
        />
      </div>
      <div class="q-pt-sm">
        Or import <a @click.prevent="importDemo" class="q-link text-primary" style="border-bottom: 1px dashed currentColor;" href="#">demo file</a>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { importFromFile } from './dat/dat-file'
import { fetchFile, progress } from './patchcdn/cache'
import { loadIndex, ContentTree, loadFileContent } from './patchcdn/index-store'
import { DEMO_HDRS } from './viewer/_demo_data'

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
    if (this.poePatch && !ContentTree.tree.length) {
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
        this.$q.notify({ color: 'negative', message: e.message, progress: true })
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
        this.$q.loading.show({ delay: 0, message: 'Reading index of 500,000+ files and 35,000+ folders' })
        await loadIndex(bundle)
        localStorage.setItem('POE_PATCH_VER', this.poePatch)
      } catch (e) {
        this.$q.notify({ color: 'negative', message: e.message, progress: true })
      } finally {
        this.$q.loading.hide()
      }
    },
    async importDemo () {
      if (!ContentTree.tree.length) {
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
