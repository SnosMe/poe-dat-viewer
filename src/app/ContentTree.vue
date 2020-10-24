<template>
  <div class="shadow-1 layout-column" style="width: 300px; flex-shrink: 0;">
    <virtual-scroll
      class="flex-1"
      :items="tree"
      :item-height="29"
    >
      <template v-slot="props">
        <div :style="{ height: props.height + 'px' }">
          <div v-for="(item, idx) in props.items" :key="item.label"
            style="position: absolute; width: 100%; max-width: 100%; overflow: hidden;"
            :style="{ top: (props.top + (idx * (29))) + 'px' }"
            class="q-pa-xs">
            <q-btn
              style="font-weight: normal"
              flat no-caps dense
              class="full-width" align="left" no-wrap
              :label="item.label"
              :icon="item.isFile ? '' : 'la la-folder-open'"
              @click="handleFolderNav(item)" />
          </div>
        </div>
      </template>
    </virtual-scroll>
  </div>
</template>

<script>
import { ContentTree, listDirContent, loadFile } from './patchcdn/index-store'
import VirtualScroll from './VirtualScroll'

export default {
  components: { VirtualScroll },
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
