const host = 'http://localhost:8080';

const mycuckoo = {
  login: {
    firstStepUrl: host + '/login/step/first',
    secondStepUrl: host + '/login/step/second',
    thirdStepUrl: host + '/login/step/third',
  }
}

if(exports) {
  const axios = require('axios');
  axios.defaults.baseURL = host;
  axios.defaults.withCredentials = true
  axios.defaults.headers.post['Content-Type'] = 'application/json; charset=UTF-8';

  //返回状态判断(添加响应拦截器)
  axios.interceptors.response.use((res) => {
    if(res.data.code == 405) {//未登录
      window.location = '/view/login.html';
    }

    return res;
  }, (error) => {
    MyCuckoo.showMsg({state: 'danger', title: '提示', msg: error.response.data.message});
    return Promise.reject(error);
  });
  
  module.exports = {
    getLogout: function() {
      return axios.post('/login/logout').then(res => res.data.data);
    },
    postMenu: function(params) {
      return axios.post('/login/step/third', params).then(res => res.data.data);
    },
    postUploadLogo: host + '/uum/user/mgr/upload/photo',

    userMgr: {
      getChildNodes: function(params) {
        return axios.get('/uum/user/mgr/get/child/nodes', {params: params}).then(res => res.data.data);
      },
      list: function(params) {
        return axios.get('/uum/user/mgr/list', {params: params}).then(res => res.data.data);
      },
      create: function(params) {
        return axios.post('/uum/user/mgr/create', params).then(res => res.data.data);
      },
      view: function(params) {
        return axios.get('/uum/user/mgr/view', {params: params}).then(res => res.data.data);
      }
    },
  }
}