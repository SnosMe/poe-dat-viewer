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
      <div v-if="!isTypeUnknown"
        class="q-mb-sm q-pl-sm flex no-wrap items-baseline">
        <div class="q-mb-xs q-mr-sm">View mode</div>
        <q-btn-group unelevated>
          <q-btn label="Bytes" padding="0 sm" no-caps color="primary" text-color="white" class="q-mr-px" />
          <q-btn label="Data" padding="0 sm" no-caps color="blue-grey-1" text-color="black" />
        </q-btn-group>
      </div>
      <div class="q-mb-sm q-pl-sm">
        <div class="q-mb-xs flex items-baseline justify-between">
          <span>Data type</span>
          <q-btn v-if="!isTypeUnknown" @click="clearDataType"
            padding="0 sm" label="clear" no-caps flat color="blue-grey-7" class="border-b" />
        </div>
        <div class="font-mono bg-grey-3 q-py-xs q-px-sm q-mr-sm text-blue-8 rounded-borders">Ref -> ?[]</div>
        <q-option-group dense size="xs"
          v-if="isTypeUnknown"
          :value="undefined"
          @input="handleDataTypeChange"
          :options="dataTypeOpts"
        />
      </div>
      <div class="flex justify-end q-mt-lg">
        <q-btn @click="remove" padding="0 sm" label="Remove" no-caps flat color="negative" />
      </div>
    </div>
  </div>
</template>

<script>
import { state } from './viewer/Viewer'
import { isHeaderTypeUnknown, removeHeader } from './viewer/headers'

export default {
  data () {
    return {
      tmp1: undefined
    }
  },
  computed: {
    header () {
      return state.editHeader
    },
    dataType: {
      get () {
        return this.tmp1
      },
      set (value) {
        this.tmp1 = value
      }
    },
    isTypeUnknown () {
      return isHeaderTypeUnknown(this.header)
    },
    dataTypeOpts () {
      const opts = []

      const len = this.header.length
      if (len === 8) {
        if (this.stats.refArray) {
          opts.push({ label: 'Array', value: 'reference' })
        } else {
          opts.push({ label: 'Array (invalid data)', value: 'reference', disable: true })
        }
      } else {
        opts.push({ label: 'Array (invalid size)', value: 'reference', disable: true })
      }

      if (len === 4) {
        if (this.stats.refString) {
          opts.push({ label: 'String', value: 'reference' })
        } else {
          opts.push({ label: 'String (invalid data)', value: 'reference', disable: true })
        }
      } else {
        opts.push({ label: 'String (invalid size)', value: 'reference', disable: true })
      }

      if (len === 8 || len === 4 || len === 2 || len === 1) {
        opts.push({ label: 'Integer', value: 'integer' })
      } else {
        opts.push({ label: 'Integer (invalid size)', value: 'integer', disable: true })
      }

      if (len === 8 || len === 4) {
        opts.push({ label: 'Decimal', value: 'decimal' })
      } else {
        opts.push({ label: 'Decimal (invalid size)', value: 'decimal', disable: true })
      }

      if (len === 1) {
        if (this.stats.bMax > 0x01) {
          opts.push({ label: 'Boolean (invalid data)', value: 'boolean', disable: true })
        } else {
          opts.push({ label: 'Boolean', value: 'boolean' })
        }
      } else {
        opts.push({ label: 'Boolean (invalid size)', value: 'boolean', disable: true })
      }

      return opts
    },
    stats () {
      return state.columnStats[this.header.offset]
    }
  },
  methods: {
    handleDataTypeChange (type) {
      const header = this.header
      if (type === 'reference') {
        if (header.length === 4) {
          this.$set(header.type, 'ref', { array: false })
          this.$set(header.type, 'string', {})
        } else {
          this.$set(header.type, 'ref', { array: true })
        }
      } else if (type === 'integer') {
        this.$set(header.type, 'integer', { unsigned: true, nullable: header.length >= 4, size: header.length })
      } else if (type === 'decimal') {
        this.$set(header.type, 'decimal', { size: header.length })
      } else if (type === 'boolean') {
        this.$set(header.type, 'boolean', {})
      }
    },
    clearDataType () {
      this.header.type = {
        byteView: {}
      }
    },
    remove () {
      removeHeader(state.editHeader, state.headers, state.columns)
      state.editHeader = null
    }
  }
}
</script>
