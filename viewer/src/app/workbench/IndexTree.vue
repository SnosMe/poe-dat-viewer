<template>
  <div class="layout-column shrink-0" :style="{ 'width': showTree ? '300px' : undefined }">
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
      <div :class="['flex gap-x-1 pb-1.5 px-2 justify-end', $style.filterBar]">
        <span v-if="!extensionOpts.length">No files with extensions</span>
        <button v-for="opt in extensionOpts" :key="opt.value"
          @click="opt.handleClick"
          :class="['px-2', $style.filterBtn, (opt.active ? $style.filterActive : $style.filterIdle) ]"
          v-text="opt.value" />
      </div>
      <div v-if="!isIndexLoaded"
        class="italic text-center text-muted p-2">Waiting for Index bundle...</div>
      <div v-if="isIndexLoaded && !tree.length"
        class="italic text-center text-muted p-2">No results found</div>
      <virtual-scroll
        class="flex-1"
        :scrollable-props="{ style: 'background: var(--color-surface);', widthY: 10 }"
        :items="tree"
        :item-height="22"
      >
        <template v-slot="props">
          <button v-for="entry in props.entries" :key="entry.item.fullPath"
            :class="{ [$style.itemBtn]: true, [$style.active]: entry.item.isActive }"
            :style="{ transform: `translate(0, ${entry.top}px` }"
            @click="handleTreeNav(entry.item)"
          >
            <i v-if="!entry.item.isFile" class="codicon codicon-folder pr-3"></i
            >{{ entry.item.label }}</button>
        </template>
      </virtual-scroll>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef, computed, inject } from 'vue'
import FileSaver from 'file-saver'
import VirtualScroll, { type VirtualScrollT } from '@/VirtualScroll.vue'
import { openTab, activeTabId, hasTabId, setActiveTab } from './workbench-core.js'
import type { BundleIndex } from '@/app/patchcdn/index-store.js'
import DatViewer from '../dat-viewer/components/DatViewer.vue'

interface TreeItem {
  label: string
  fullPath: string
  isFile: boolean
  isActive?: boolean
}

function useTreeNavigation (index: BundleIndex) {
  const currentDir = shallowRef('')

  index.watch(() => {
    currentDir.value = ''
  })

  const dirContent = computed(() => index.getDirContent(currentDir.value))

  const tree = computed<TreeItem[]>(() => {
    if (!index.isLoaded) return []

    if (currentDir.value === '') {
      const dirs = index.getRootDirs()

      return dirs.map(dirName => ({
        label: dirName,
        fullPath: dirName,
        isFile: false
      })).sort((a, b) => a.label.localeCompare(b.label))
    }

    return [
      {
        label: '../',
        fullPath: (currentDir.value.indexOf('/') === -1)
          ? ''
          : currentDir.value.split('/').slice(0, -1).join('/'),
        isFile: false
      },
      ...dirContent.value.dirs.map(dirName => ({
        label: dirName.substr(currentDir.value.length + 1),
        fullPath: dirName,
        isFile: false
      })).sort((a, b) => a.label.localeCompare(b.label)),
      ...dirContent.value.files.map(fileName => ({
        label: fileName.substr(currentDir.value.length + 1),
        fullPath: fileName,
        isFile: true,
        isActive: (`bundles@${fileName}` === activeTabId.value)
      })).sort((a, b) => a.label.localeCompare(b.label))
    ]
  })

  async function handleTreeNav (item: TreeItem) {
    if (!item.isFile) {
      currentDir.value = item.fullPath
    } else {
      if (item.fullPath.endsWith('.datc64')) {
        if (hasTabId(`bundles@${item.fullPath}`)) {
          setActiveTab(`bundles@${item.fullPath}`)
          return
        }
      }

      const fileContent = await index.loadFileContent(item.fullPath)

      if (item.fullPath.endsWith('.datc64')) {
        openTab({
          id: `bundles@${item.fullPath}`,
          title: item.label,
          type: DatViewer,
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
    currentDir,
    tree,
    handleTreeNav
  }
}

export default defineComponent({
  components: { VirtualScroll: VirtualScroll as VirtualScrollT<TreeItem> },
  setup () {
    const index = inject<BundleIndex>('bundle-index')!

    const showTree = shallowRef(true)
    function toggleTree () {
      showTree.value = !showTree.value
    }

    const { tree, handleTreeNav } = useTreeNavigation(index)

    const searchExtension = shallowRef('.datc64')
    const extensionOpts = computed(() => {
      const extensions: string[] = []
      for (const entry of tree.value) {
        if (entry.isFile && entry.label.lastIndexOf('.') !== -1) {
          const ext = entry.label.slice(entry.label.lastIndexOf('.'))
          if (!extensions.includes(ext)) {
            extensions.push(ext)
          }
        }
      }

      return extensions.map(ext => ({
        value: ext,
        active: searchExtension.value === ext,
        handleClick: () => {
          searchExtension.value = (searchExtension.value !== ext) ? ext : ''
        }
      }))
    })

    const searchText = shallowRef('')
    const filteredTree = computed(() => {
      const term = searchText.value.toLowerCase()
      const ext = extensionOpts.value
        .some(opt => opt.value === searchExtension.value) ? searchExtension.value : ''
      return tree.value.filter(item => {
        return item.label.toLowerCase().includes(term) &&
          (item.isFile ? item.label.endsWith(ext) : true)
      })
    })

    return {
      showTree,
      toggleTree,
      tree: filteredTree,
      handleTreeNav,
      searchText,
      isIndexLoaded: computed(() => index.isLoaded),
      extensionOpts
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
    background: var(--color-hover);
  }
}

.searchInput {
  @apply h-7;
  border: 1px solid var(--color-border);
  box-sizing: content-box;
  @apply flex-1;
  @apply mx-1;
  @apply px-1 py-px;
  background: var(--color-surface);
  color: var(--color-text);

  &:focus {
    border-color: var(--color-selection-strong);
  }
}

.itemBtn {
  position: absolute;
  line-height: 22px;
  @apply px-3;
  text-align: left;
  @apply truncate;
  width: 100%;
  display: flex;
  align-items: center;
  color: var(--color-text);
  background: transparent;

  &:hover {
    background: var(--color-hover);
  }

  &.active {
    background: var(--color-selection-strong);
    color: var(--color-text-inverse);
  }
}

.filterBtn {
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-muted);
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }
}

.filterActive {
  background: var(--color-selection-soft);
  color: var(--color-text);
}

.filterIdle {
  background: transparent;
}

.filterBar {
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
</style>
