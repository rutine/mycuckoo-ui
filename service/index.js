import vue from 'vue';
import vueRouter  from 'vue-router';
import viewHeader from '../view/header.vue';
import viewSidebar from '../view/sidebar.vue';
import pagination from '../view/component/pagination.vue';
import toolbar from '../view/component/toolbar.vue';
import api from '../public/static/mycuckoo.api.js';


vue.prototype.api = api;

vue.use(vueRouter);

//注册全局组件
vue.component('pagination', pagination);
vue.component('toolbar', toolbar);

const router = new vueRouter({
    routes: [
      { path: '/userCommFunMgr', component: resolve => require(['../view/uum/test.vue'], resolve) },
      { path: '/uum/userMgr/:moduleId', component: resolve => require(['../view/uum/userMgr.vue'], resolve) }
    ]
});

router.afterEach((to, from, next) => {
  if(to.path != '/') {
    document.getElementById('welcome-page').className = 'hide';
  } else {
    document.getElementById('welcome-page').className = 'active';
  }
  
  document.title = '系统平台';
});

api.postMenu(null).then(data => {
  vue.prototype.menu = data;
  new vue({
    router,
    components: {
      viewHeader: viewHeader,
      viewSidebar: viewSidebar
    }
  }).$mount('#app');
});