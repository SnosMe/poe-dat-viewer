declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'vue-virtual-scroller' {
  export default function install(): void
}

declare module 'fnv-plus' {
  export function fast1a64(str: string): string
}
