import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    vin: '',
    savePath: ''
  },
  mutations: {
    SET_SUCCESSTIP(state, data) {
      state.savePath = data;
    }
  },
  actions: {

  }
})

export default store
