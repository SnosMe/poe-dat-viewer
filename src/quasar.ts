import Vue from 'vue'

import './styles/quasar.scss'
import iconSet from 'quasar/icon-set/fontawesome-v5.js'
import {
  Quasar,
  QBtn,
  QVirtualScroll,
  QScrollArea,
  QBtnGroup,
  QInput,
  QBtnToggle,
  QOptionGroup,
  QToggle
} from 'quasar'

Vue.use(Quasar, {
  config: {},
  components: {
    QOptionGroup,
    QBtnToggle,
    QInput,
    QBtnGroup,
    QScrollArea,
    QVirtualScroll,
    QBtn,
    QToggle
  },
  directives: {
  },
  plugins: {
  },
  iconSet: iconSet
})
