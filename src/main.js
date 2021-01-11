import Vue from 'vue';
import VsCodeExtension from './pages/VsCodeExtension.vue';
import data from './stories/data/scenario.json';

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(VsCodeExtension, { ref: 'ui' }),
  mounted() {
    this.$refs.ui.loadData(data);
  },
}).$mount('#app');
