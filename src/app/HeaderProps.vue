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
          <q-btn v-if="!isTypeUnknown"
            padding="0 sm" label="clear" no-caps flat color="blue-grey-7" class="border-b" />
        </div>
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
      if (len === 8 || len === 4) {
        opts.push({ label: 'Reference', value: 'reference' })
      } else {
        opts.push({ label: 'Reference (invalid size)', value: 'reference', disable: true })
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
        opts.push({ label: 'Boolean', value: 'boolean' })
      } else {
        opts.push({ label: 'Boolean (invalid size)', value: 'boolean', disable: true })
      }

      return opts
    }
  },
  methods: {
    handleDataTypeChange (type) {
      if (type === 'reference') {
        this.$set(this.header.type, 'ref', { array: this.header.length !== 4 })
      } else if (type === 'integer') {
        this.$set(this.header.type, 'integer', { unsigned: true, nullable: false, size: this.header.length })
      } else if (type === 'decimal') {
        this.$set(this.header.type, 'decimal', { size: this.header.length })
      } else if (type === 'boolean') {
        this.$set(this.header.type, 'boolean', {})
      }
    },
    remove () {
      removeHeader(state.editHeader, state.headers, state.columns)
      state.editHeader = null
    }
  }
}
</script>
