import Vue from 'vue'

import './styles/quasar.scss'
import '@quasar/extras/line-awesome/line-awesome.css'
import iconSet from 'quasar/icon-set/line-awesome.js'
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
  QSeparator,
  QMarkupTable,
  QLinearProgress,
  QBadge,
  QFile,
  QSlideTransition,
  QIcon,
  QItem,
  QItemSection,
  QItemLabel,
  QList,
  Notify,
  Loading,
  QTree
} from 'quasar'

Vue.use(Quasar, {
  config: {},
  components: {
    QTree,
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
    QSeparator,
    QMarkupTable,
    QLinearProgress,
    QBadge,
    QFile,
    QSlideTransition,
    QIcon,
    QItem,
    QItemSection,
    QItemLabel,
    QList
  },
  directives: {
    ClosePopup
  },
  plugins: {
    Notify,
    Loading
  },
  iconSet: iconSet
})
