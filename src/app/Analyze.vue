<template>
  <div v-if="!datFile">UPLOAD FILE</div>
  <div v-else class="layout-column">
    <div class="app-titlebar">
      <div class="ellipsis q-mr-xs">{{ datFile.name }}</div>
      <q-space />
      <q-btn padding="0 sm" label="Help" no-caps flat @click="helpDialog = true" />
      <q-btn padding="0 sm" label="Settings" no-caps flat />
    </div>
    <q-dialog v-model="exportSchemaDialog">
      <export-schema />
    </q-dialog>
    <q-dialog v-model="helpDialog">
      <help-content />
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
        <q-btn @click="exportSchemaDialog = true" padding="0 sm" label="Export schema" no-caps color="blue-grey-8" />
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
          <q-virtual-scroll
            :items="rows"
            :virtual-scroll-item-size="24"
            scroll-target="#viewer-fancy-scroll > .scroll"
            >
            <template #before>
              <viewer-head
                :headers="headers"
                :columns="columns"
                :row-number-length="rowNumberLength" />
            </template>
            <template v-slot="{ index }">
              <data-row
                :row-idx="index"
                :format="rowFormat" />
            </template>
          </q-virtual-scroll>
        </q-scroll-area>
        <div class="bg-blue-grey-9 q-pa-sm text-white text-body2">
          <div>Made by Alexander Drozdov, v{{ appVersion }} <a class="q-link text-white border-b" href="https://github.com/SnosMe/poe-dat-viewer">GitHub</a></div>
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
import { state, importFile } from './viewer/Viewer'
import { getColumnSelections, clearColumnSelection } from './viewer/selection'
import { getRowFormating } from './viewer/formatting'
import { createHeaderFromSelected } from './viewer/headers'

export default {
  components: { ViewerHead, HeaderProps, DataRow, ExportSchema, HelpContent },
  created () {
    importFile()
  },
  data () {
    return state
  },
  computed: {
    rowComponent () {
      return DataRow
    },
    rowFormat () {
      return getRowFormating(this.columns)
    },
    selections () {
      return getColumnSelections(this.columns).map(range =>
        range.map(col => col.colNum100).join(' ')
      )
    },
    rows () {
      return new Array(this.datFile.rowCount).fill(undefined)
    },
    appVersion () {
      return process.env.APP_VERSION
    }
  },
  methods: {
    defineColumn () {
      state.editHeader = createHeaderFromSelected(state.columns, state.headers)
      clearColumnSelection(state.columns)
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
</style>
