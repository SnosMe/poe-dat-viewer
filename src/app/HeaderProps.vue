<template>
  <div v-if="header" style="width: 20rem;" class="shadow-1 h-full">
    <div class="flex items-center bg-blue-grey-8 q-px-md shadow-1 font-mono" style="height: 6ch;">
      <div class="text-white font-sans">Column properties</div>
    </div>
    <div v-if="header.name === null" class="q-pa-md">
      <div>{{ header.length }} bytes of unidentified data</div>
    </div>
    <div v-else class="q-pa-sm">
      <div class="q-mb-md q-mt-sm q-px-sm">
        <q-input label="Name" placeholder="unnamed" v-model.trim="header.name" outlined />
      </div>
      <div
        class="q-mb-sm q-pl-sm flex no-wrap items-baseline">
        <div class="q-mb-xs q-mr-sm">View mode</div>
        <q-btn-group unelevated>
          <q-btn label="Bytes" @click="setByteViewMode(true)"
            padding="0 sm" no-caps :color="header.type.byteView ? 'primary' : 'blue-grey-1'" :text-color="header.type.byteView ? 'white' : 'black'" class="q-mr-px" />
          <q-btn label="Data" @click="setByteViewMode(false)" :disable="!dataType"
            padding="0 sm" no-caps :color="header.type.byteView ? 'blue-grey-1' : 'primary'" :text-color="header.type.byteView ? 'black' : 'white'" />
        </q-btn-group>
      </div>
      <div class="q-mb-sm q-pl-sm">
        <div class="q-mb-xs flex items-baseline justify-between">
          <span>Data type</span>
          <q-btn @click="remove"
            padding="0 sm" label="Remove" no-caps flat color="negative" />
        </div>
        <q-option-group dense size="xs"
          v-model="dataType"
          :options="dataTypeOpts" />
        <div v-if="arrayTypeOpts.length" class="q-mt-sm">
          <div>of ...</div>
          <q-option-group dense size="xs"
            v-model="arrayType"
            :options="arrayTypeOpts" />
        </div>
        <div class="q-mt-sm" v-if="header.type.integer">
          <q-toggle label="Unsigned" dense size="xs"
            @input="recacheAfterOptChange"
            v-model="header.type.integer.unsigned" />
          <q-toggle label="Nullable" dense size="xs" class="q-ml-md"
            @input="recacheAfterOptChange"
            v-model="header.type.integer.nullable" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { state, disableByteView, enableByteView } from './viewer/Viewer'
import { removeHeader } from './viewer/headers'
import { cacheHeaderDataView } from './viewer/formatting'

export default {
  computed: {
    header () {
      return state.editHeader
    },
    dataTypeOpts () {
      const opts = []

      const len = this.header.length
      if (len === 8 && this.stats.refArray) {
        opts.push({ label: 'Array', value: 'reference' })
      }
      if (len === 4 && this.stats.refString) {
        opts.push({ label: 'String', value: 'reference' })
      }
      if (len === 8 || len === 4 || len === 2 || len === 1) {
        opts.push({ label: 'Integer', value: 'integer' })
      }
      if (len === 8 || len === 4) {
        opts.push({ label: 'Decimal', value: 'decimal' })
      }
      if (len === 1 && this.stats.bMax <= 0x01) {
        opts.push({ label: 'Boolean', value: 'boolean' })
      }

      return opts
    },
    arrayTypeOpts () {
      const opts = []

      if (!this.header.type.ref || !this.header.type.ref.array) {
        return opts
      }

      const array = this.stats.refArray
      if (array.string) {
        opts.push({ label: 'String', value: 'string' })
      }
      if (array.longLong) {
        opts.push({ label: 'Integer - 8 bytes', value: 'integer_8' })
      }
      if (array.long) {
        opts.push({ label: 'Integer - 4 bytes', value: 'integer_4' })
      }
      if (array.short) {
        opts.push({ label: 'Integer - 2 bytes', value: 'integer_2' })
      }
      if (array.longLong) {
        opts.push({ label: 'Decimal - 8 bytes', value: 'decimal_8' })
      }
      if (array.long) {
        opts.push({ label: 'Decimal - 4 bytes', value: 'decimal_4' })
      }
      if (array.boolean) {
        opts.push({ label: 'Boolean', value: 'boolean' })
      }
      opts.push({ label: 'Integer - byte', value: 'integer_1' })

      return opts
    },
    stats () {
      return state.columnStats[this.header.offset]
    },
    dataType: {
      get () {
        const type = this.header.type
        if (type.ref) {
          return 'reference'
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
        this.setByteViewMode(true)
        const header = this.header
        header.type = {
          byteView: {}
        }
        if (type === 'reference') {
          if (header.length === 4) {
            this.$set(header.type, 'ref', { array: false })
            this.$set(header.type, 'string', {})
          } else {
            this.$set(header.type, 'ref', { array: true })
            return
          }
        } else if (type === 'integer') {
          this.$set(header.type, 'integer', { unsigned: true, nullable: header.length >= 4, size: header.length })
        } else if (type === 'decimal') {
          this.$set(header.type, 'decimal', { size: header.length })
        } else if (type === 'boolean') {
          this.$set(header.type, 'boolean', {})
        }
        cacheHeaderDataView(header, state.datFile)
        this.setByteViewMode(false)
      }
    },
    arrayType: {
      get () {
        const type = this.header.type
        if (type.string) {
          return 'string'
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
        this.setByteViewMode(true)
        const header = this.header
        header.type = {
          byteView: {},
          ref: { array: true }
        }
        if (type === 'string') {
          this.$set(header.type, 'string', {})
        } else if (type === 'integer_1') {
          this.$set(header.type, 'integer', { unsigned: true, nullable: false, size: 1 })
        } else if (type === 'integer_2') {
          this.$set(header.type, 'integer', { unsigned: true, nullable: false, size: 2 })
        } else if (type === 'integer_4') {
          this.$set(header.type, 'integer', { unsigned: true, nullable: false, size: 4 })
        } else if (type === 'integer_8') {
          this.$set(header.type, 'integer', { unsigned: true, nullable: false, size: 8 })
        } else if (type === 'decimal_4') {
          this.$set(header.type, 'decimal', { size: 4 })
        } else if (type === 'decimal_8') {
          this.$set(header.type, 'decimal', { size: 8 })
        } else if (type === 'boolean') {
          this.$set(header.type, 'boolean', {})
        }
        cacheHeaderDataView(header, state.datFile)
        this.setByteViewMode(false)
      }
    }
  },
  methods: {
    recacheAfterOptChange () {
      cacheHeaderDataView(this.header, state.datFile)
    },
    remove () {
      this.setByteViewMode(true)
      removeHeader(state.editHeader, state.headers, state.columns)
      state.editHeader = null
    },
    setByteViewMode (byteView) {
      if (byteView) {
        if (!this.header.type.byteView) {
          enableByteView(this.header, state.columns, state.columnStats)
        }
      } else {
        if (this.header.type.byteView) {
          disableByteView(this.header, state.columns)
        }
      }
    }
  }
}
</script>
