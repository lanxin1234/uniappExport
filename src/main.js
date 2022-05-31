import Vue from 'vue'
import App from './App'

import UploadQueue from '@/utils/uploadQueueSqlite.js'
Vue.prototype.$uploadQueue = new UploadQueue();
import store from './store'

Vue.config.productionTip = false


App.mpType = 'app'

const app = new Vue({
  ...App,
  store
})
app.$mount()
