<template>
  <div v-if="!datFile">UPLOAD FILE</div>
  <div v-else class="layout-column">
    <div class="app-titlebar">
      <div class="ellipsis q-mr-xs">{{ datFile.name }}</div>
      <q-btn padding="0 sm" label="Settings" no-caps flat />
    </div>
    <div class="flex no-wrap bg-blue-grey-9 q-pa-sm">
      <template v-if="selections.length === 0">
        <div class="text-blue-grey-4 text-italic">No bytes selected</div>
      </template>
      <template v-else-if="selections.length === 1">
        <q-btn padding="0 sm" label="Define column" no-caps color="blue-grey-8" />
      </template>
      <template v-else-if="selections.length > 1">
        <div class="text-blue-grey-2 q-pr-xs">Selections</div>
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <div v-for="sel in selections"
          class="q-px-xs q-mr-xs font-mono bg-blue-grey-2 text-blue-grey-10 rounded-borders"
          >{{ sel }}</div>
      </template>
    </div>
    <div class="flex min-h-0 flex-1">
      <div class="layout-column min-w-0 flex-1">
        <q-scroll-area
          class="flex-1"
          id="viewer-fancy-scroll"
        >
          <!-- class="flex-1 font-mono scroll" -->
          <q-virtual-scroll
            class="font-mono"
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
          <div>Made by Alexander Drozdov, v1.0.0 <a class="q-link text-white border-b" href="https://github.com/SnosMe/pogo-analyze-ui">GitHub</a></div>
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
import { state, importFile, getRowFormating, getColumnSelections } from './Viewer'

export default {
  components: { ViewerHead, HeaderProps, DataRow },
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
