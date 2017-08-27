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
    },
  }
}