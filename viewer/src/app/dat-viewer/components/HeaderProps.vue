<template>
  <div v-if="isVisible" style="width: 300px;" class="relative overflow-hidden">
    <div :style="{ height: HEADERS_HEIGHT + 'px' }" class="bg-gray-100" />
    <div class="m-2 shadow border border-gray-300 bg-white absolute inset-0 flex flex-col">
      <div class="p-2 bg-gray-100 text-gray-600 shadow flex items-center">
        <span class="px-2">Column properties</span>
        <button class="border border-gray-400 rounded-full px-3"
          @click="$emit('focus-editing-header')">Focus</button>
        <button @click="close" class="px-2 py-1 ml-auto"
          title="Close"><i class="codicon codicon-close"></i></button>
      </div>
      <div v-if="header.name === null" class="p-4">
        <div>{{ header.length }} bytes of unidentified data</div>
      </div>
      <div v-else class="p-4 overflow-auto">
        <div class="mb-4">
          <label for="datv-header-name">Name</label>
          <input id="datv-header-name" placeholder="Unnamed" v-model.trim="header.name"
            class="border p-1 mt-1 w-full focus:border-blue-500" spellcheck="false">
        </div>
        <div class="mb-4 flex items-baseline">
          <div class="mr-2">View mode</div>
          <div class="gap-x-px flex">
            <button v-for="opt in viewModeOpts" :key="opt.value"
              class="px-2"
              :class="(byteViewMode === opt.value) ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-300'"
              @click="byteViewMode = opt.value"
              :disabled="opt.disabled"
              v-text="opt.label" />
          </div>
        </div>
        <div class="mb-4">
          <div class="mb-2 flex justify-between items-baseline">
            <span>Data type</span>
            <button class="text-red-700 bg-red-100 px-2"
             @click="remove">Delete</button>
          </div>
          <div>
            <div v-for="opt in dataTypeOpts" :key="opt.value" class="mb-0.5">
              <label class="inline-flex items-center">
                <input type="radio" v-model="dataType" :value="opt.value">
                <span class="ml-2 cursor-pointer">{{ opt.label }}</span>
              </label>
            </div>
            <div v-if="arrayTypeOpts.length" class="mt-3">
              <div class="mb-1">of ...</div>
              <div v-for="opt in arrayTypeOpts" :key="opt.value" class="mb-0.5">
                <label class="inline-flex items-center">
                  <input type="radio" v-model="arrayType" :value="opt.value">
                  <span class="ml-2 cursor-pointer">{{ opt.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="mb-4" v-if="header.type.integer">
          <label class="inline-flex items-center">
            <input type="checkbox" v-model="header.type.integer.unsigned">
            <span class="ml-2 cursor-pointer">Unsigned</span>
          </label>
        </div>
        <div class="mb-4" v-if="header.type.key">
          <label for="datv-header-key-table">Table</label>
          <select id="datv-header-key-table" class="border mt-1 w-full focus:border-blue-500"
            v-model="header.type.key.table">
            <option v-for="opt of keyTableOpts" :key="opt.label"
              :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <hr class="my-6">
        <div class="mb-4" v-if="dataType">
          <label class="mr-4">Width</label>
          <input v-model.number="header.textLength"
            class="border w-16 text-center"> chars
          <div class="italic mt-2">(move mouse over the column name in Viewer and use `ScrollWheel`, hold `Ctrl` to increase resize step)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, computed, triggerRef, reactive, watch, WatchStopHandle } from 'vue'
import { Header, removeHeader } from '../headers'
import { Viewer, saveHeaders } from '../Viewer'
import { DatFile, readColumn } from 'pathofexile-dat'
import type { ColumnStats } from 'pathofexile-dat/dat-analysis'
import { HEADERS_HEIGHT } from '../rendering'
import { index } from '@/app/patchcdn/index-store'
import { foreignTableSuggestions } from './foreignTableSuggestions'

function dataTypeOpts (header: Header, stats: ColumnStats, datFile: DatFile) {
  const opts = [] as Array<{ label: string, value: string }>

  const { fieldSize } = datFile
  const len = header.length
  if (len === fieldSize.ARRAY && stats.refArray) {
    opts.push({ label: 'Array', value: 'array' })
  }
  if (len === fieldSize.STRING && stats.refString) {
    opts.push({ label: 'String', value: 'string' })
  }
  if (len === fieldSize.KEY && stats.keySelf) {
    opts.push({ label: 'Key (self)', value: 'key_self' })
  }
  if (len === fieldSize.KEY_FOREIGN && stats.keyForeign) {
    opts.push({ label: 'Key (foreign)', value: 'key_foreign' })
  }
  if (/* len === 8 || */ len === 4 /* || len === 2 || len === 1 */) {
    opts.push({ label: 'Integer', value: 'integer' })
  }
  if (/* len === 8 || */ len === 4) {
    opts.push({ label: 'Decimal', value: 'decimal' })
  }
  if (len === 1 && stats.maxValue <= 0x01) {
    opts.push({ label: 'Boolean', value: 'boolean' })
  }

  return opts
}

function arrayTypeOpts (header: Header, stats: ColumnStats) {
  const opts = [] as Array<{ label: string, value: string }>

  if (!header.type.array || !stats.refArray) {
    return opts
  }

  const array = stats.refArray
  if (array.string) {
    opts.push({ label: 'String', value: 'string' })
  }
  if (array.keySelf) {
    opts.push({ label: 'Key (self)', value: 'key_self' })
  }
  if (array.keyForeign) {
    opts.push({ label: 'Key (foreign)', value: 'key_foreign' })
  }
  // if (array.numeric64) {
  //   opts.push({ label: 'Integer - 8 bytes', value: 'integer_8' })
  // }
  if (array.numeric32) {
    opts.push({ label: 'Integer - 4 bytes', value: 'integer_4' })
  }
  // if (array.numeric16) {
  //   opts.push({ label: 'Integer - 2 bytes', value: 'integer_2' })
  // }
  // if (array.numeric64) {
  //   opts.push({ label: 'Decimal - 8 bytes', value: 'decimal_8' })
  // }
  if (array.numeric32) {
    opts.push({ label: 'Decimal - 4 bytes', value: 'decimal_4' })
  }
  if (array.boolean) {
    opts.push({ label: 'Boolean', value: 'boolean' })
  }
  // opts.push({ label: 'Integer - byte', value: 'integer_1' })

  return opts
}

export default defineComponent({
  setup () {
    const viewer = inject<Viewer>('viewer')!

    const headerRef = computed(() => (viewer.editHeader.value && reactive(viewer.editHeader.value))!)
    {
      let watchStop = null as WatchStopHandle | null
      watch(headerRef, (value) => {
        if (watchStop) {
          watchStop()
          watchStop = null
        }
        if (value) {
          watchStop = watch(value, () => {
            triggerRef(viewer.headers)
            saveHeaders(viewer)
          }, { deep: true })
        }
      })
    }

    const stats = computed(() => viewer.columnStats.value[headerRef.value.offset])

    const dataType = computed({
      get () {
        const type = headerRef.value.type
        if (type.array) {
          return 'array'
        } else if (type.string) {
          return 'string'
        } else if (type.key) {
          return type.key.foreign ? 'key_foreign' : 'key_self'
        } else if (type.integer) {
          return 'integer'
        } else if (type.decimal) {
          return 'decimal'
        } else if (type.boolean) {
          return 'boolean'
        } else {
          return undefined
        }
      },
      set (type) {
        const header = headerRef.value
        header.type = {}
        if (type === 'array') {
          header.type.array = true
          header.type.byteView = { array: true }
        } else if (type === 'string') {
          header.type.string = {}
        } else if (type === 'key_foreign') {
          header.type.key = { foreign: true, table: null, viewColumn: null }
        } else if (type === 'key_self') {
          header.type.key = { foreign: false, table: viewer.name, viewColumn: null }
        } else if (type === 'integer') {
          header.type.integer = { unsigned: false, size: header.length }
        } else if (type === 'decimal') {
          header.type.decimal = { size: header.length }
        } else if (type === 'boolean') {
          header.type.boolean = {}
        }
      }
    })

    const arrayType = computed({
      get () {
        const type = headerRef.value.type
        if (type.string) {
          return 'string'
        } else if (type.key) {
          return (type.key.foreign) ? 'key_foreign' : 'key_self'
        } else if (type.integer) {
          return `integer_${type.integer.size}`
        } else if (type.decimal) {
          return `decimal_${type.decimal.size}`
        } else if (type.boolean) {
          return 'boolean'
        } else {
          return undefined
        }
      },
      set (type) {
        const header = headerRef.value
        header.type = { array: true }
        if (type === 'string') {
          header.type.string = {}
        } else if (type === 'key_foreign') {
          header.type.key = { foreign: true, table: null, viewColumn: null }
        } else if (type === 'key_self') {
          header.type.key = { foreign: false, table: viewer.name, viewColumn: null }
        } else if (type === 'integer_1') {
          header.type.integer = { unsigned: false, size: 1 }
        } else if (type === 'integer_2') {
          header.type.integer = { unsigned: false, size: 2 }
        } else if (type === 'integer_4') {
          header.type.integer = { unsigned: false, size: 4 }
        } else if (type === 'integer_8') {
          header.type.integer = { unsigned: false, size: 8 }
        } else if (type === 'decimal_4') {
          header.type.decimal = { size: 4 }
        } else if (type === 'decimal_8') {
          header.type.decimal = { size: 8 }
        } else if (type === 'boolean') {
          header.type.boolean = {}
        }
      }
    })

    const viewModeOpts = computed(() => {
      const opts = [] as Array<{ label: string, value: string, disabled?: boolean }>
      const type = headerRef.value.type

      opts.push({ label: 'Bytes', value: 'bytes' })
      if (type.array) {
        opts.push({ label: 'Var. bytes', value: 'array-bytes' })
      }
      opts.push({ label: 'Data', value: 'data', disabled: !dataType.value || (dataType.value === 'array' && !arrayType.value) })

      return opts
    })

    const byteViewMode = computed({
      get () {
        const type = headerRef.value.type
        if (type.byteView) {
          return type.byteView.array ? 'array-bytes' : 'bytes'
        } else {
          return 'data'
        }
      },
      set (mode) {
        const type = headerRef.value.type
        if (mode === 'data') {
          type.byteView = undefined
        } else {
          type.byteView = {
            array: mode === 'array-bytes'
          }
        }
      }
    })

    const maxKeyRid = computed(() => {
      const values = readColumn(headerRef.value, viewer.datFile)
      // Math.max(null) is 0, this is perfect for us
      return Math.max(
        ...(headerRef.value.type.array
          ? (values as number[][]).flat()
          : (values as number[])))
    })

    const keyTableOpts = computed(() => {
      let out: Array<{ value: string | null, label: string }>

      if (!headerRef.value.type.key!.foreign) {
        out = [{ value: viewer.name, label: viewer.name }]
        return out
      }

      out = [{ value: null, label: 'rid (unknown)' }]
      if (index.value!.tableStats.length) {
        const tables = foreignTableSuggestions(viewer.name, maxKeyRid.value, index.value!.tableStats)
        out.push(...tables.map(table => ({ value: table.name, label: table.name })))
      } else if (headerRef.value.type.key!.table !== null) {
        out.push({ value: headerRef.value.type.key!.table, label: headerRef.value.type.key!.table })
      }
      return out
    })

    function close () {
      viewer.editHeader.value = null
    }

    function remove () {
      removeHeader(headerRef.value, viewer.headers.value)
      viewer.editHeader.value = null
      triggerRef(viewer.headers)
      saveHeaders(viewer)
    }

    return {
      isVisible: computed(() => viewer.editHeader.value != null),
      HEADERS_HEIGHT,
      header: headerRef,
      byteViewMode,
      dataType,
      arrayType,
      close,
      remove,
      viewModeOpts,
      keyTableOpts,
      dataTypeOpts: computed(() =>
        dataTypeOpts(headerRef.value, stats.value, viewer.datFile)),
      arrayTypeOpts: computed(() =>
        arrayTypeOpts(headerRef.value, stats.value))
    }
  }
})
</script>
