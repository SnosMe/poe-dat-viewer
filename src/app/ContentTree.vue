<template>
  <q-scroll-area
    style="width: 300px; flex-shrink: 0;" class="shadow-1 q-pa-xs"
    id="content-tree-fancy-scroll"
  >
    <q-virtual-scroll
      :items="tree"
      :virtual-scroll-item-size="29"
      scroll-target="#content-tree-fancy-scroll > .scroll"
      >
      <template v-slot="{ item }">
        <q-btn :label="item.label"
          flat no-caps style="font-weight: normal" dense
          class="full-width" align="left" no-wrap
          :icon="item.isFile ? '' : 'la la-folder-open'"
          @click="handleFolderNav(item)" />
      </template>
    </q-virtual-scroll>
  </q-scroll-area>
</template>

<script>
import { ContentTree, listDirContent, loadFile } from './patchcdn/index-store'

export default {
  data () {
    return ContentTree
  },
  methods: {
    handleFolderNav (item) {
      let fullPath
      if (item.label === '../') {
        const slashIdx = this.current.lastIndexOf('/')
        fullPath = (slashIdx === -1) ? '' : this.current.substring(0, slashIdx)
      } else {
        fullPath = this.current ? `${this.current}/${item.label}` : item.label
      }

      if (!item.isFile) {
        listDirContent(fullPath)
      } else {
        loadFile(fullPath)
      }
    }
  }
}
</script>
