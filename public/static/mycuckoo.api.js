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
  $.get = function (url, properties, params) {
    if (!params) {
      params = properties;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, params) : url;

    return $get(url, params);
  }

  $.postJson = function (url, properties, params) {
    if (!params) {
      params = properties;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, properties) : url;

    return $.ajax({
      url: url,
      contentType: 'application/json;charset=UTF-8',
      data: (typeof params == 'string') ? params : JSON.stringify(params)
    });
  }

  $.put = function (url, properties, params) {
    if (!params) {
      params = properties;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, params) : url;

    return $.ajax({
      url: url,
      type: 'PUT',
      contentType: 'application/json;charset=UTF-8',
      data: (typeof params == 'string') ? params : JSON.stringify(params)
    });
  }

  $.delete = function (url, properties, params) {
    if (!params) {
      params = properties;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, params) : url;

    return $.ajax({
      url: url,
      type: 'DELETE',
      contentType: 'application/json;charset=UTF-8',
      data: (typeof params == 'string') ? params : JSON.stringify(params)
    });
  }

  var api = {
    host: host,

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
      url: host + '/uum/role/mgr',
      disEnableUrl: host + '/uum/role/mgr/{id}/disEnable/{disEnableFlag}',
      rolePrivilegeUrl: host + '/uum/role/mgr/{id}/role-privilege',
      saveOperationPrivilegeUrl: host + '/uum/role/mgr/{id}/operation-privilege/{privilegeScope}',
      saveRowPrivilegeUrl: host + '/uum/role/mgr/{id}/row-privilege',
    },
    userMgr: {
      url: host + '/uum/user/mgr',
      queryUsersUrl: host + '/uum/user/mgr/query/users',
      updatePhoto: host + '/uum/user/mgr/update/photo',
      updatePassword: host + '/uum/user/mgr/update/password',
      resetPwdUrl: host + '/uum/user/mgr/{id}/reset-password',
      disEnableUrl: host + '/uum/user/mgr/{id}/disEnable/{disEnableFlag}',
      childNodesUrl: host + '/uum/user/mgr/{id}/child/nodes',
      userPrivilegeUrl: host + '/uum/user/mgr/{id}/user-privilege',
      rolePrivilegeUrl: host + '/uum/user/mgr/{id}/role-privilege',
      rowPrivilegeUrl: host + '/uum/user/mgr/{id}/row-privilege',
      saveOperationPrivilegeUrl: host + '/uum/user/mgr/{id}/operation-privilege/{privilegeScope}',
      saveRolePrivilegeUrl: host + '/uum/user/mgr/{id}/role-privilege/{defaultRoleId}',
      saveRowPrivilegeUrl: host + '/uum/user/mgr/{id}/row-privilege/{privilegeScope}'
    },

    moduleMgr: {
      url: host + '/platform/module/mgr',
      disEnableUrl: host + '/platform/module/mgr/{id}/disEnable/{disEnableFlag}',
      childNodesUrl: host + '/platform/module/mgr/{id}/child/nodes',
      operationUrl: host + '/platform/module/mgr/{id}/operation',
      saveModuleOptRefsUrl: host + '/platform/module/mgr/{id}/module-opt-ref',
    },
    operateMgr: {
      url: host + '/platform/operate/mgr',
      disEnableUrl: host + '/platform/operate/mgr/{id}/disEnable/{disEnableFlag}',
    },
    afficheMgr: {
      url: host + '/platform/affiche/mgr'
    },
    accessoryMgr: {
      url: host + '/platform/accessory/mgr'
    },
    fileMgr: {
      url: host + '/file'
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