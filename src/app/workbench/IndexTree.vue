<template>
  <div class="layout-column flex-shrink-0" :style="{ 'width': showTree ? '300px' : undefined }">
    <div class="flex p-1 items-center mb-px">
      <button
        title="Toggle tree visibility"
        :class="$style.treeToggle"
        @click="toggleTree"
        ><i class="codicon codicon-list-flat"></i></button>
      <input v-if="showTree"
        v-model.trim="searchText"
        placeholder="Search in current folder"
        :class="$style.searchInput"
        type="search" spellcheck="false">
    </div>
    <template v-if="showTree">
      <div v-if="!isIndexLoaded"
        class="italic text-center text-gray-600 p-2">Waiting for Index bundle...</div>
      <div v-if="isIndexLoaded && !tree.length"
        class="italic text-center text-gray-600 p-2">No results found</div>
      <virtual-scroll
        class="flex-1"
        :items="tree"
        :item-height="22"
      >
        <template v-slot="props">
          <div :style="{ height: props.height + 'px' }">
            <div v-for="(item, idx) in props.items" :key="item.fullPath"
              :class="$style.itemBtn"
              :style="{ top: (props.top + (idx * (22))) + 'px' }">
              <button @click="handleTreeNav(item)">
                <i v-if="!item.isFile" class="codicon codicon-folder pr-3"></i
                >{{ item.label }}</button>
            </div>
          </div>
        </template>
      </virtual-scroll>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef, computed, watch } from 'vue'
import FileSaver from 'file-saver'
import VirtualScroll from '../VirtualScroll.vue'
import { getRootDirs, getDirContent } from '../bundles/index-paths'
import { index, loadFileContent } from '../patchcdn/index-store'
import { openTab } from './workbench-core'
import DatViewer from '../dat-viewer/DatViewer.vue'

interface TreeItem {
  label: string
  fullPath: string
  isFile: boolean
}

function useTreeNavigation () {
  const currentDir = shallowRef('')

  watch(index, () => {
    currentDir.value = ''
  })

  const tree = computed<TreeItem[]>(() => {
    if (!index.value) return []

    if (currentDir.value === '') {
      const dirs = getRootDirs(index.value.pathReps, index.value.dirsInfo)

      return dirs.map(dirName => ({
        label: dirName,
        fullPath: dirName,
        isFile: false
      })).sort((a, b) => a.label.localeCompare(b.label))
    }

    const content = getDirContent(currentDir.value, index.value.pathReps, index.value.dirsInfo)

    return [
      {
        label: '../',
        fullPath: (currentDir.value.indexOf('/') === -1)
          ? ''
          : currentDir.value.split('/').slice(0, -1).join('/'),
        isFile: false
      },
      ...content.dirs.map(dirName => ({
        label: dirName.substr(currentDir.value.length + 1),
        fullPath: dirName,
        isFile: false
      })).sort((a, b) => a.label.localeCompare(b.label)),
      ...content.files.map(fileName => ({
        label: fileName.substr(currentDir.value.length + 1),
        fullPath: fileName,
        isFile: true
      })).sort((a, b) => a.label.localeCompare(b.label))
    ]
  })

  async function handleTreeNav (item: TreeItem) {
    if (!item.isFile) {
      currentDir.value = item.fullPath
    } else {
      const fileContent = await loadFileContent(item.fullPath)

      if (item.fullPath.endsWith('.dat') || item.fullPath.endsWith('.dat64')) {
        openTab({
          id: `bundles@${item.fullPath}`,
          title: item.label,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: DatViewer as any,
          args: {
            fileContent,
            fullPath: item.fullPath
          }
        })
      } else {
        FileSaver.saveAs(new File(
          [fileContent],
          item.fullPath.substring(item.fullPath.lastIndexOf('/') + 1),
          { type: 'application/octet-stream' }
        ))
      }
    }
  }

  return {
    tree,
    handleTreeNav
  }
}

export default defineComponent({
  components: { VirtualScroll },
  setup () {
    const showTree = shallowRef(true)
    function toggleTree () {
      showTree.value = !showTree.value
    }

    const isIndexLoaded = computed(() => {
      return Boolean(index.value)
    })

    const { tree, handleTreeNav } = useTreeNavigation()

    const searchText = shallowRef('')
    const filteredTree = computed(() => {
      if (!searchText.value) return tree.value

      const term = searchText.value.toLowerCase()
      return tree.value.filter(item => {
        return item.label.toLowerCase().includes(term)
      })
    })

    return {
      showTree,
      toggleTree,
      tree: filteredTree,
      handleTreeNav,
      searchText,
      isIndexLoaded
    }
  }
})
</script>

<style lang="postcss" module>
.treeToggle {
  @apply p-1;
  @apply m-1;
  line-height: 1;

  &:hover {
    @apply bg-gray-200;
  }
}

.searchInput {
  @apply h-7;
  @apply border;
  box-sizing: content-box;
  @apply flex-1;
  @apply mx-1;
  @apply px-1 py-px;

  &:focus {
    @apply border-blue-500;
  }
}

.itemBtn {
  position: absolute;
  width: 100%;
  line-height: 22px;
  @apply px-2;

  & > button {
    width: 100%;
    text-align: left;
    @apply px-1;
    @apply truncate;

    &:hover {
      @apply bg-gray-200;
    }
  }
}
</style>
