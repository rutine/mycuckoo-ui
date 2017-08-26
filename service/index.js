import vue from 'vue';
import vueRouter  from 'vue-router';
import viewHeader from '../view/header.vue';
import viewSidebar from '../view/sidebar.vue';
import api from '../public/static/mycuckoo.api.js';


vue.prototype.api = api;

vue.use(vueRouter);

const router = new vueRouter({
    routes: [
      { path: '/userCommFunMgr', component: resolve => require(['../view/uum/test.vue'], resolve) }
    ]
});

new vue({
    router,
    components: {
      viewHeader: viewHeader,
      viewSidebar: viewSidebar
    }
}).$mount('#app');

router.afterEach((to, from, next) => {
  if(to.path != '/') {
    document.getElementById('welcome-page').className = 'hide';
  } else {
    document.getElementById('welcome-page').className = 'active';
  }
  
  document.title = '系统平台';
});
