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
  QToggle,
  QDialog,
  ClosePopup,
  QCard,
  QCardActions,
  QCardSection,
  QSpace,
  QTab,
  QTabs,
  QTabPanel,
  QTabPanels,
  QSeparator
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
    QToggle,
    QDialog,
    QCard,
    QCardActions,
    QCardSection,
    QSpace,
    QTab,
    QTabs,
    QTabPanel,
    QTabPanels,
    QSeparator
  },
  directives: {
    ClosePopup
  },
  plugins: {
  },
  iconSet: iconSet
})
