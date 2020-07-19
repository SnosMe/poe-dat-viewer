declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'vue-virtual-scroller' {
  export default function install(): void
}
