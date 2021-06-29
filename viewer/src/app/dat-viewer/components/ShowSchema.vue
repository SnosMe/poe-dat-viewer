<template>
  <div class="p-4 overflow-auto border-l flex-1 text-base">
    <pre>{{ text }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { Header } from '../headers'

export default defineComponent({
  props: {
    args: {
      type: Object as PropType<{
        name: string
        headers: Header[]
      }>,
      required: true
    }
  },
  setup (props) {
    return {
      text: computed(() => {
        const { name, headers } = props.args
        let fields = ''
        for (const header of headers) {
          if (header.name == null) break

          let type = ''
          if (header.type.boolean) {
            type = 'bool'
          } else if (header.type.string) {
            type = 'string'
          } else if (header.type.integer?.size === 1) {
            type = header.type.integer.unsigned ? 'u8' : 'i8'
          } else if (header.type.integer?.size === 2) {
            type = header.type.integer.unsigned ? 'u16' : 'i16'
          } else if (header.type.integer?.size === 4) {
            type = header.type.integer.unsigned ? 'u32' : 'i32'
          } else if (header.type.integer?.size === 8) {
            type = header.type.integer.unsigned ? 'u64' : 'i64'
          } else if (header.type.decimal?.size === 4) {
            type = 'f32'
          } else if (header.type.decimal?.size === 8) {
            type = 'f64'
          } else if (header.type.key) {
            type = header.type.key.foreign ? 'rid' : name
          }

          if (header.type.array) {
            fields += `  ${header.name || '_'}: [${type || '_'}]\n`
          } else if (type) {
            fields += `  ${header.name || '_'}: ${type}\n`
          } else {
            break
          }
        }
        return `type ${name} {\n${fields}}\n`
      })
    }
  }
})
</script>
