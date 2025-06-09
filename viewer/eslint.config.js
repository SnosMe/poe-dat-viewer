import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
// import loveConfig from 'eslint-config-love'

export default defineConfigWithVueTs(
  pluginVue.configs['flat/essential'],
  vueTsConfigs['recommended'],
  // loveConfig
)
