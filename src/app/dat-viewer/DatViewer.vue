<template>
  <virtual-scroll
    class="flex-1 font-mono"
    style="--ppc: 8px; letter-spacing: calc(var(--ppc) - 1ch);"
    :items="rows"
    :item-height="14 * 1.5"
    :header-height="72"
  >
    <template #header>
      <viewer-head
        :headers="viewer.headers"
        :columns="viewer.columns" />
    </template>
    <template v-slot="props">
      <div style="min-width: min-content;" :style="{ height: props.height + 'px' }">
        <data-row v-for="(rowIdx, idx) in props.items" :key="rowIdx"
          style="position: absolute;"
          :style="{ top: (props.top + (idx * (14 * 1.5))) + 'px' }"
          :row-idx="rowIdx"
          :format="rowFormat" />
      </div>
    </template>
  </virtual-scroll>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, computed, provide } from 'vue'
import { importFromFile } from '../dat/dat-file'
import { getRowFormating } from '../viewer/formatting'
import { Viewer } from '../viewer/Viewer'
import DataRow from './DataRow.vue'
import ViewerHead from './ViewerHead.vue'
import VirtualScroll from '../VirtualScroll.vue'

export default defineComponent({
  components: { DataRow, ViewerHead, VirtualScroll },
  props: {
    args: {
      type: Object as PropType<{
        fileContent: Uint8Array
        fullPath: string
      }>,
      required: true
    }
  },
  setup (props) {
    const instance = reactive(// TODO: ouch very bad idea, but it's how it worked in vue2
      new Viewer()
    )
    provide('viewer', instance)

    ;(async function init () {
      const datFile = await importFromFile(props.args.fullPath, props.args.fileContent)
      await instance.loadDat(datFile)
    })()

    const rowFormat = computed(() => {
      return getRowFormating(instance.columns)
    })

    const rows = computed(() => {
      if (instance.datFile) {
        if (instance.rowSorting) {
          return instance.rowSorting
        } else {
          return new Array(instance.datFile.rowCount).fill(undefined)
            .map((_, idx) => idx)
        }
      }
      return []
    })

    return {
      rowFormat,
      rows,
      viewer: instance
    }
  }
})
</script>
