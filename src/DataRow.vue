<template>
  <div class="inline-flex">
    <div class="whitespace-pre sticky left-0 bg-gray-100 text-blue-600 px-1 border-r">{{ row.rowId }}</div>
    <!-- eslint-disable-next-line vue/require-v-for-key -->
    <div v-for="byte in formatted"
      class="px-1 whitespace-no-wrap">{{ byte }}</div>
  </div>
</template>

<script>
export default {
  props: ['source', 'headers', 'variableData'],
  computed: {
    row () {
      return this.source
    },
    formatted () {
      return [Array.from(this.row.data)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ')]
    }
  }
}
</script>
