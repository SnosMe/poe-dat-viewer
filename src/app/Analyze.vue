<template>
  <div class="layout-column">
    <div class="app-titlebar">
      <div v-if="viewer.datFile" class="ellipsis q-mr-xs">{{ viewer.datFile.meta.ggpkPath }}</div>
      <q-space />
      <q-btn padding="0 sm" label="Import" no-caps flat @click="app.importDialog = true" class="q-mr-sm" />
      <q-btn padding="0 sm" label="Help" no-caps flat @click="app.helpDialog = true" class="q-mr-sm" />
      <q-btn padding="0 sm" label="Settings" no-caps flat />
    </div>
    <q-dialog v-model="app.exportSchemaDialog">
      <export-schema />
    </q-dialog>
    <q-dialog v-model="app.helpDialog">
      <help-content />
    </q-dialog>
    <q-dialog v-model="app.importDialog">
      <import-dialog />
    </q-dialog>
    <div class="flex no-wrap bg-blue-grey-9 q-pa-sm">
      <div class="flex no-wrap">
        <template v-if="selections.length === 0">
          <div class="text-blue-grey-4 text-italic">No bytes selected</div>
        </template>
        <template v-else-if="selections.length === 1">
          <q-btn @click="defineColumn" padding="0 sm" label="Define column" no-caps color="blue-grey-8" />
        </template>
        <template v-else-if="selections.length > 1">
          <div class="text-blue-grey-2 q-pr-xs">Selections</div>
          <!-- eslint-disable-next-line vue/require-v-for-key -->
          <div v-for="sel in selections"
            class="q-px-xs q-mr-xs font-mono bg-blue-grey-2 text-blue-grey-10 rounded-borders"
            >{{ sel }}</div>
        </template>
      </div>
      <q-space />
      <div class="flex no-wrap">
        <q-btn @click="app.exportSchemaDialog = true" :disable="!viewer.datFile" padding="0 sm" label="Export schema" no-caps color="blue-grey-8" />
      </div>
    </div>
    <div class="flex min-h-0 flex-1">
      <div class="layout-column min-w-0 flex-1">
        <q-scroll-area
          class="flex-1 font-mono"
          style="--ppc: 8px; letter-spacing: calc(var(--ppc) - 1ch);"
          id="viewer-fancy-scroll"
        >
          <!-- class="flex-1 font-mono scroll" -->
          <!-- TODO: REMOVE IT BEFORE BETA -->
          <q-virtual-scroll
            :items="rows"
            :virtual-scroll-item-size="24"
            scroll-target="#viewer-fancy-scroll > .scroll"
            >
            <template #before>
              <viewer-head
                :headers="viewer.headers"
                :columns="viewer.columns" />
            </template>
            <template v-slot="{ index }">
              <data-row
                :row-idx="index"
                :format="rowFormat" />
            </template>
          </q-virtual-scroll>
        </q-scroll-area>
        <div class="app-footer bg-blue-grey-9 q-pa-sm text-white text-body2 flex q-gutter-x-lg">
          <div>Made by Alexander Drozdov, v{{ appVersion }} <a class="q-link text-white border-b" href="https://github.com/SnosMe/poe-dat-viewer">GitHub</a></div>
          <a href="https://discord.gg/SJjBdT3" class="flex"><img src="@/assets/discord-badge.svg" /></a>
        </div>
      </div>
      <div class="flex-shrink-0">
        <header-props />
      </div>
    </div>
  </div>
</template>

<script>
import DataRow from './DataRow'
import ViewerHead from './ViewerHead'
import HeaderProps from './HeaderProps'
import ExportSchema from './ExportSchema'
import HelpContent from './HelpContent'
import ImportDialog from './ImportDialog'
import { App } from './viewer/Viewer'
import { getAllFilesMeta } from './dat/file-cache'
import { getByHash } from './dat/dat-file'
import { getColumnSelections, clearColumnSelection } from './viewer/selection'
import { getRowFormating } from './viewer/formatting'
import { createHeaderFromSelected } from './viewer/headers'

export default {
  components: { ViewerHead, HeaderProps, DataRow, ExportSchema, HelpContent, ImportDialog },
  async created () {
    const files = await getAllFilesMeta()
    if (files.length) {
      this.$q.loading.show({ delay: 0 })
      try {
        const datFile = await getByHash(files[0].sha256)
        await this.viewer.loadDat(datFile)
        await this.viewer.tryImportHeaders(datFile.meta.headers)
      } catch (e) {
        console.error(e)
      }
      this.$q.loading.hide()
    }
  },
  provide () {
    return {
      viewer: this.viewer,
      app: this.app
    }
  },
  data () {
    const app = new App()

    return {
      app: app,
      viewer: app.viewers[0].instance
    }
  },
  computed: {
    rowComponent () {
      return DataRow
    },
    rowFormat () {
      return getRowFormating(this.viewer.columns)
    },
    selections () {
      return getColumnSelections(this.viewer.columns).map(range =>
        range.map(col => col.colNum100).join(' ')
      )
    },
    rows () {
      if (this.viewer.datFile) {
        return new Array(this.viewer.datFile.rowCount).fill(undefined)
      }
      return []
    },
    appVersion () {
      return process.env.APP_VERSION
    }
  },
  methods: {
    defineColumn () {
      const { viewer } = this
      viewer.editHeader = createHeaderFromSelected(viewer.columns, viewer.headers)
      clearColumnSelection(viewer.columns)
      viewer.saveHeadersToFileCache()
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/quasar.variables';

.app-titlebar {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: $blue-grey-9;
  color: $grey-1;
  box-shadow: $shadow-1;
  z-index: 1;
}

.app-footer {
  img {
    filter: grayscale(0.75);
  }

  &:hover {
    img {
      filter: grayscale(0);
    }
  }
}
</style>
