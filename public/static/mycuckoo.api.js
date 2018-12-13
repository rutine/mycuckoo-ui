layui.use(['jquery'], function () {
  const $ = layui.jquery;
  const host = 'http://localhost:8080';

  $.ajaxSetup({
    type: 'POST',
    //contentType: 'application/json',
    dataType: 'json',
    xhrFields: { withCredentials: true },
    statusCode: {
      401: function(xhr) {
        layer.closeAll();
        layer.open({title: '未登录', content: xhr.responseJSON.message});
      },
      500: function(xhr) {
        layer.closeAll();
        layer.open({title: '错误', content: xhr.responseJSON.message});
      }
    },
    error: function(xhr, status, thrown) {
      console.log(xhr);
    }
  });

  let placeholder = /\{(\w+)\}/;
  let resolvePlaceholder = function(uri, obj) {
    var path = uri;
    for (var p in obj) {
      var witch = typeof p;
      if ("string" == witch || 'number' == witch) {
        path = path.replace('{' + p + '}', obj[p]);
      }
    }

    return path;
  }

  let $get = $.get;
  $.get = function (url, params) {
    url = placeholder.test(url) ? resolvePlaceholder(url, params) : url;

    return $get(url, params);
  }

  $.postJson = function (url, params) {
    url = placeholder.test(url) ? resolvePlaceholder(url, params) : url;

    return $.ajax({
      url: url,
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify(params)
    });
  }

  $.put = function (url, params) {
    url = placeholder.test(url) ? resolvePlaceholder(url, params) : url;

    return $.ajax({
      url: url,
      type: 'PUT',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify(params)
    });
  }

  $.delete = function (url, params) {
    url = placeholder.test(url) ? resolvePlaceholder(url, params) : url;

    return $.ajax({
      url: url,
      type: 'DELETE',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify(params)
    });
  }

  var api = {
    host: host,
    download: host + '/file/download',
    postFile: host + '/file',

    login: {
      firstStepUrl: host + '/login/step/first',
      secondStepUrl: host + '/login/step/second',
      thirdStepUrl: host + '/login/step/third'
    },

    postFirstStep: function(params) {
      return $.post(host + '/login/step/first', params).then(res => res.data);
    },
    postSecondStep: function(params) {
      return $.postJson(host + '/login/step/second', params).then(res => res.data);
    },
    postMenu: function(params) {
      return $.post(host + '/login/step/third', params).then(res => res.data);
    },
    getLogout: function() {
      return $.post(host + '/login/logout').then(res => res.data);
    },

    organMgr: {
      url: host + '/uum/organ/mgr',
      childNodesUrl: host + '/uum/organ/mgr/{id}/child/nodes',
      disEnableUrl: host + '/uum/organ/mgr/{id}/disEnable/{disEnableFlag}',
    },
    organRoleMgr: {
      url: host + '/uum/role/assign/mgr',
      unSelectRoleUrl: host + '/uum/role/assign/mgr/{orgId}/unselect/role'
    },
    roleMgr: {
      list: function(params) {
        return $.get('/uum/role/mgr/list', {params: params}).then(res => res.data);
      },
      listRowPrivilege: function(params) {
        return $.get('/uum/role/mgr/list/row/privilege', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/uum/role/mgr/create', params).then(res => res.data);
      },
      update: function(params) {
        return $.put('/uum/role/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/uum/role/mgr/view', {params: params}).then(res => res.data);
      },
      del: function(params) {
        return $.delete('/uum/role/mgr/delete', {params: params}).then(res => res.data);
      },
      disEnable: function(params) {
        return $.get('/uum/role/mgr/disEnable', {params: params}).then(res => res.data);
      },
      saveOperationPrivilege: function(params) {
        return $.get('/uum/role/mgr/save/operation/privilege', {params: params}).then(res => res.data);
      },
      saveRowPrivilege: function(params) {
        return $.get('/uum/role/mgr/save/row/privilege', {params: params}).then(res => res.data);
      },
    },
    userMgr: {
      getChildNodes: function(params) {
        return $.get('/uum/user/mgr/get/child/nodes', {params: params}).then(res => res.data);
      },
      list: function(params) {
        return $.get('/uum/user/mgr/list', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/uum/user/mgr/create', params).then(res => res.data);
      },
      update: function(params) {
        return $.put('/uum/user/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/uum/user/mgr/view', {params: params}).then(res => res.data);
      },
      del: function(params) {
        return $.delete('/uum/user/mgr/delete', {params: params}).then(res => res.data);
      },
      disEnable: function(params) {
        return $.get('/uum/user/mgr/disEnable', {params: params}).then(res => res.data);
      },
      resetPwd: function(params) {
        return $.get('/uum/user/mgr/reset/password', {params: params}).then(res => res.data);
      },
      listRolePrivilege: function(params) {
        return $.get('/uum/user/mgr/list/role/privilege', {params: params}).then(res => res.data);
      },
      listUserPrivilege: function(params) {
        return $.get('/uum/user/mgr/list/user/privilege', {params: params}).then(res => res.data);
      },
      listRowPrivilege: function(params) {
        return $.get('/uum/user/mgr/list/row/privilege', {params: params}).then(res => res.data);
      },
      saveRolePrivilege: function(params) {
        return $.get('/uum/user/mgr/save/role/privilege', {params: params}).then(res => res.data);
      },
      saveOperationPrivilege: function(params) {
        return $.get('/uum/user/mgr/save/operation/privilege', {params: params}).then(res => res.data);
      },
      saveRowPrivilege: function(params) {
        return $.get('/uum/user/mgr/save/row/privilege', {params: params}).then(res => res.data);
      },
      queryUsers: function(params) {
        return $.get('/uum/user/mgr/query/users', {params: params}).then(res => res.data);
      },
      updatePhoto: function(params) {
        return $.put('/uum/user/mgr/update/photo', params).then(res => res.data);
      },
      updatePassword: function(params) {
        return $.put('/uum/user/mgr/update/password', params).then(res => res.data);
      }
    },


    moduleMgr: {
      getChildNodes: function(params) {
        return $.get('/platform/module/mgr/get/child/nodes', {params: params}).then(res => res.data);
      },
      list: function(params) {
        return $.get('/platform/module/mgr/list', {params: params}).then(res => res.data);
      },
      listOperation: function(params) {
        return $.get('/platform/module/mgr/list/operation', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/platform/module/mgr/create', params).then(res => res.data);
      },
      createModuleOptRefs: function(params) {
        return $.get('/platform/module/mgr/create/module/operation/ref', {params: params}).then(res => res.data);
      },
      update: function(params) {
        return $.put('/platform/module/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/module/mgr/view', {params: params}).then(res => res.data);
      },
      del: function(params) {
        return $.delete('/platform/module/mgr/delete', {params: params}).then(res => res.data);
      },
    },
    operateMgr: {
      list: function(params) {
        return $.get('/platform/operate/mgr/list', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/platform/operate/mgr/create', params).then(res => res.data);
      },
      update: function(params) {
        return $.put('/platform/operate/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/operate/mgr/view', {params: params}).then(res => res.data);
      },
      disEnable: function(params) {
        return $.get('/platform/operate/mgr/disEnable', {params: params}).then(res => res.data);
      },
    },
    afficheMgr: {
      list: function(params) {
        return $.get('/platform/affiche/mgr/list', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/platform/affiche/mgr/create', params).then(res => res.data);
      },
      update: function(params) {
        return $.put('/platform/affiche/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/affiche/mgr/view', {params: params}).then(res => res.data);
      },
      del: function(params) {
        return $.delete('/platform/affiche/mgr/delete', {params: params}).then(res => res.data);
      },
    },
    accessoryMgr: {
      del: function(params) {
        return $.delete('/platform/accessory/mgr/delete', {params: params}).then(res => res.data);
      },
    },
    fileMgr: {
      del: function(params) {
        return $.delete('/file/delete', {params: params}).then(res => res.data);
      },
    },
    codeMgr: {
      list: function(params) {
        return $.get('/platform/code/mgr/list', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/platform/code/mgr/create', params).then(res => res.data);
      },
      update: function(params) {
        return $.put('/platform/code/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/code/mgr/view', {params: params}).then(res => res.data);
      },
      del: function(params) {
        return $.delete('/platform/code/mgr/delete', {params: params}).then(res => res.data);
      },
      disEnable: function(params) {
        return $.get('/platform/code/mgr/disEnable', {params: params}).then(res => res.data);
      },
    },
    districtMgr: {
      url: host + '/platform/district/mgr',
      childNodesUrl: host + '/platform/district/mgr/{id}/child/nodes',
      disEnableUrl: host + '/platform/district/mgr/{id}/disEnable/{disEnableFlag}'
    },
    dictionaryMgr: {
      url: host + '/platform/system/dictionary/mgr/',
      smallTypeUrl: host + '/platform/system/dictionary/mgr/{bigTypeCode}/small/type',
      disEnableUrl: host + '/platform/system/dictionary/mgr/{id}/disEnable/{disEnableFlag}'
    },
    schedulerMgr: {
      list: function(params) {
        return $.get('/platform/system/scheduler/mgr/list', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/platform/system/scheduler/mgr/create', params).then(res => res.data);
      },
      update: function(params) {
        return $.put('/platform/system/scheduler/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/system/scheduler/mgr/view', {params: params}).then(res => res.data);
      },
      startScheduler: function(params) {
        return $.get('/platform/system/scheduler/mgr/start/scheduler').then(res => res.data);
      },
      stopScheduler: function(params) {
        return $.get('/platform/system/scheduler/mgr/stop/scheduler').then(res => res.data);
      },
      startJob: function(params) {
        return $.get('/platform/system/scheduler/mgr/start/job', {params: params}).then(res => res.data);
      },
      stopJob: function(params) {
        return $.get('/platform/system/scheduler/mgr/stop/job', {params: params}).then(res => res.data);
      },
      schedulerStatus: function(params) {
        return $.get('/platform/system/scheduler/mgr/scheduler/status', {params: params}).then(res => res.data);
      },
    },
    systemConfigMgr: {
      list: function(params) {
        return $.get('/platform/system/config/mgr/list', {params: params}).then(res => res.data);
      },
      update: function(params) {
        return $.put('/platform/system/config/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/system/config/mgr/view', {params: params}).then(res => res.data);
      },
      startJConsole: function(params) {
        return $.get('/platform/system/config/mgr/start/jconsole').then(res => res.data);
      },
    },
    systemLogMgr: {
      list: function(params) {
        return $.get('/platform/system/log/mgr/list', {params: params}).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/system/log/mgr/view', {params: params}).then(res => res.data);
      }
    },
    systemLogMgr: {
      list: function(params) {
        return $.get('/platform/system/log/mgr/list', {params: params}).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/system/log/mgr/view', {params: params}).then(res => res.data);
      }
    },
    systemParameterMgr: {
      list: function(params) {
        return $.get('/platform/system/parameter/mgr/list', {params: params}).then(res => res.data);
      },
      create: function(params) {
        return $.put('/platform/system/parameter/mgr/create', params).then(res => res.data);
      },
      update: function(params) {
        return $.put('/platform/system/parameter/mgr/update', params).then(res => res.data);
      },
      view: function(params) {
        return $.get('/platform/system/parameter/mgr/view', {params: params}).then(res => res.data);
      },
      disEnable: function(params) {
        return $.get('/platform/system/parameter/mgr/disEnable', {params: params}).then(res => res.data);
      },
    }
  }

  window.api = api;
});