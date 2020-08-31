<template>
  <q-card style="max-width: 80vw;">
    <q-card-section>
      <div class="q-gutter-xs flex items-baseline">
        <q-input value="patch.poecdn.com/patch/" filled hint="Patch CDN" readonly dense style="width: 200px;" />
        <q-input v-model.trim="poePatch" filled hint="Patch #" dense placeholder="3.11.x.x.x" style="width: 100px;" />
        <q-input v-model.trim="ggpkPath" filled hint="Path inside GGPK" dense placeholder="/Data/BaseItemTypes.dat64" style="width: 250px;" />
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
        <q-space />
        <div class="text-caption text-italic text-grey-7 q-mr-sm">{{ (totalSize / 1000000).toFixed(2) }} MB stored</div>
        <q-btn label="Recent files" @click="showRecent = !showRecent"
          flat no-caps dense :icon-right="fasAngleDown" text-color="grey-8" />
      </div>
      <q-slide-transition>
        <div v-show="!showRecent">
          <div class="q-pt-sm">
            Or import <a @click.prevent="importDemo" class="q-link text-primary" style="border-bottom: 1px dashed currentColor;" href="#">demo file</a>
          </div>
        </div>
      </q-slide-transition>
      <q-slide-transition>
        <div v-show="showRecent">
          <div class="q-pt-sm"><q-space /></div>
          <q-markup-table flat bordered class="q-mt-xs scroll" style="max-height: 40vh;">
            <thead>
              <tr><th class="text-left text-grey-7 no-border" colspan="4" style="font-size: 0.875rem; font-weight: normal;">Recent files</th></tr>
            </thead>
            <tbody>
              <tr v-for="file of cacheFiles" :key="file.sha256">
                <td class="text-left">
                  <div>
                    <span class="text-weight-medium">{{ file.ggpkPath }}</span>
                    <span v-if="file.patch" class="text-grey-8"> - {{ file.patch }}</span>
                  </div>
                  <div class="text-caption text-grey-8">
                    SHA-256: {{ file.sha256.substr(0, 7) }}&mldr;
                  </div>
                </td>
                <td class="text-right">
                  {{ file.cachedAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </td>
                <td class="text-right">
                  {{ (file.size / 1000000).toFixed(2) }} MB
                </td>
                <td class="text-right">
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn @click="remove(file.sha256)" class="gt-xs" size="12px" dense label="Delete" outline />
                    <q-btn @click="open(file.sha256)" size="12px" dense label="Open" color="primary" />
                  </div>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </q-slide-transition>
    </q-card-section>
  </q-card>
</template>

<script>
import { fasAngleDown, fasEraser } from '@quasar/extras/fontawesome-v5'
import { getAllFilesMeta, deleteByHash } from './dat/file-cache'
import { importFromPoeCdn, importFromFile, getByHash, findLatestHeaders, getNamePart } from './dat/dat-file'
import { IMPORT_HDRS } from './viewer/_test_data'

export default {
  async created () {
    this.fasAngleDown = fasAngleDown

    this.cacheFiles = await getAllFilesMeta()
  },
  inject: ['app', 'viewer'],
  data () {
    return {
      showRecent: false,
      poePatch: '',
      ggpkPath: '',
      isCdnImportRunning: false,
      cacheFiles: []
    }
  },
  computed: {
    totalSize () {
      return this.cacheFiles.reduce((total, file) => total + file.size, 0)
    }
  },
  methods: {
    async handleFile (e) {
      try {
        const datFile = await importFromFile(e)
        this.cacheFiles = await getAllFilesMeta()
        await this.commonImport(datFile, true)
      } catch (e) {
        this.$q.notify({ color: 'negative', message: e.message, progress: true })
      }
    },
    async cdnImport () {
      try {
        this.isCdnImportRunning = true
        const datFile = await importFromPoeCdn(this.poePatch, this.ggpkPath)
        this.cacheFiles = await getAllFilesMeta()
        await this.commonImport(datFile, true)
      } catch (e) {
        this.$q.notify({ color: 'negative', message: e.message, progress: true })
      } finally {
        this.isCdnImportRunning = false
      }
    },
    async importDemo () {
      try {
        this.poePatch = '3.11.1.6.2'
        this.ggpkPath = 'Data/Russian/BaseItemTypes.dat'
        {
          this.isCdnImportRunning = true
          const datFile = await importFromPoeCdn(this.poePatch, this.ggpkPath)
          this.cacheFiles = await getAllFilesMeta()
          await this.commonImport(datFile, false)
        }
        try {
          this.viewer.tryImportHeaders(IMPORT_HDRS)
        } catch (e) { console.error(e) }
      } catch (e) {
        this.$q.notify({ color: 'negative', message: e.message, progress: true })
        this.$q.notify({ color: 'primary', message: 'You may need to adjust the patch version.' })
      } finally {
        this.isCdnImportRunning = false
      }
    },
    async commonImport (datFile, findHeaders) {
      try {
        this.$q.loading.show({ delay: 0 })
        await this.viewer.loadDat(datFile)
        try {
          if (findHeaders && !datFile.meta.headers.length) {
            const headers = await findLatestHeaders(getNamePart(datFile.meta.ggpkPath))
            if (headers) {
              // NOTE: mutating headers after `viewer.loadDat(datFile)`
              datFile.meta.headers = headers
            }
          }
          this.viewer.tryImportHeaders(datFile.meta.headers)
        } catch (e) {
          this.$q.notify({ color: 'warning', message: e.message, progress: true })
        }
        this.app.importDialog = false
      } finally {
        this.$q.loading.hide()
      }
    },
    async remove (hash) {
      await deleteByHash(hash)
      this.cacheFiles = await getAllFilesMeta()
    },
    async open (hash) {
      try {
        const datFile = await getByHash(hash)
        await this.commonImport(datFile, false)
      } catch (e) {
        this.$q.notify({ color: 'negative', message: e.message, progress: true })
      }
    }
  }
}
</script>
