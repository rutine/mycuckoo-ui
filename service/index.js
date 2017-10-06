import vue from 'vue';
import vueRouter  from 'vue-router';
import viewHeader from '../view/header.vue';
import viewSidebar from '../view/sidebar.vue';
import pagination from '../view/component/pagination.vue';
import toolbar from '../view/component/toolbar.vue';
import selector from '../view/component/selector.vue';
import api from '../public/static/mycuckoo.api.js';


vue.prototype.api = api;

vue.use(vueRouter);

//注册全局组件
vue.component('pagination', pagination);
vue.component('toolbar', toolbar);
vue.component('selector', selector);

const router = new vueRouter({
  routes: [
    { path: '/setting/updateUserInfo', component: resolve => require(['../view/uum/userInfoSetting.vue'], resolve) },
    { path: '/uum/organMgr/:moduleId', component: resolve => require(['../view/uum/organMgr.vue'], resolve) },
    { path: '/uum/roleAssignMgr/:moduleId', component: resolve => require(['../view/uum/organRoleMgr.vue'], resolve) },
    { path: '/uum/userMgr/:moduleId', component: resolve => require(['../view/uum/userMgr.vue'], resolve) },
    { path: '/uum/roleMgr/:moduleId', component: resolve => require(['../view/uum/roleMgr.vue'], resolve) },

    { path: '/platform/moduleMgr/:moduleId', component: resolve => require(['../view/platform/module/moduleMgr.vue'], resolve) },
    { path: '/platform/operateMgr/:moduleId', component: resolve => require(['../view/platform/module/operateMgr.vue'], resolve) },
    { path: '/platform/afficheMgr/:moduleId', component: resolve => require(['../view/platform/module/afficheMgr.vue'], resolve) },
    { path: '/platform/codeMgr/:moduleId', component: resolve => require(['../view/platform/module/codeMgr.vue'], resolve) },
    { path: '/platform/districtMgr/:moduleId', component: resolve => require(['../view/platform/module/districtMgr.vue'], resolve) },
    { path: '/platform/typeDictionaryMgr/:moduleId', component: resolve => require(['../view/platform/system/dictionaryMgr.vue'], resolve) },
    { path: '/platform/schedulerMgr/:moduleId', component: resolve => require(['../view/platform/system/schedulerMgr.vue'], resolve) },
    { path: '/platform/systemConfigMgr/:moduleId', component: resolve => require(['../view/platform/system/systemConfigMgrForm.vue'], resolve) },
    { path: '/platform/systemLogMgr/:moduleId', component: resolve => require(['../view/platform/system/systemLogMgr.vue'], resolve) },
    { path: '/platform/systemParameterMgr/:moduleId', component: resolve => require(['../view/platform/system/systemParameterMgr.vue'], resolve) },
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
  vue.prototype.menu = data.menu;
  vue.prototype.userInfo = data.user;

  new vue({
    router,
    components: {
      viewHeader: viewHeader,
      viewSidebar: viewSidebar
    }
  }).$mount('#app');
});