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
        layer.open({
          title: '未登录',
          content: xhr.responseJSON.message,
          end: function () {
            parent.location.href = parent.location.protocol + '/login.html';
          },
        });
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

  var placeholder = /\{(\w+)\}/;
  var resolvePlaceholder = function(uri, uriVariables) {
    var path = uri;
    for (var variable in uriVariables) {
      var witch = typeof variable;
      if ("string" == witch || 'number' == witch) {
        path = path.replace('{' + variable + '}', uriVariables[variable]);
      }
    }

    return path;
  }

  var $get = $.get;
  $.get = function (url, uriVariables, params) {
    if (!params) {
      params = uriVariables;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, uriVariables) : url;

    return $get(url, params);
  }

  $.postJson = function (url, uriVariables, params) {
    if (!params) {
      params = uriVariables;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, uriVariables) : url;

    return $.ajax({
      url: url,
      contentType: 'application/json;charset=UTF-8',
      data: (typeof params == 'string') ? params : JSON.stringify(params)
    });
  }

  $.put = function (url, uriVariables, params) {
    if (!params) {
      params = uriVariables;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, uriVariables) : url;

    return $.ajax({
      url: url,
      type: 'PUT',
      contentType: 'application/json;charset=UTF-8',
      data: (typeof params == 'string') ? params : JSON.stringify(params)
    });
  }

  $.delete = function (url, uriVariables, params) {
    if (!params) {
      params = uriVariables;
    }
    url = placeholder.test(url) ? resolvePlaceholder(url, uriVariables) : url;

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
      return $.get(host + '/login/logout').then(res => res.data);
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
      saveOptPrivilegeUrl: host + '/uum/role/mgr/{id}/opt-privilege/{privilegeScope}',
      saveRowPrivilegeUrl: host + '/uum/role/mgr/{id}/row-privilege',
    },
    userMgr: {
      url: host + '/uum/user/mgr',
      selectorUrl: host + '/uum/user/mgr/selector',
      updatePhoto: host + '/uum/user/mgr/update/photo',
      updatePwdUrl: host + '/uum/user/mgr/update/password',
      resetPwdUrl: host + '/uum/user/mgr/{id}/reset-password',
      disEnableUrl: host + '/uum/user/mgr/{id}/disEnable/{disEnableFlag}',
      childNodesUrl: host + '/uum/user/mgr/{id}/child/nodes',
      userPrivilegeUrl: host + '/uum/user/mgr/{id}/user-privilege',
      rolePrivilegeUrl: host + '/uum/user/mgr/{id}/role-privilege',
      rowPrivilegeUrl: host + '/uum/user/mgr/{id}/row-privilege',
      saveOptPrivilegeUrl: host + '/uum/user/mgr/{id}/opt-privilege/{privilegeScope}',
      saveRolePrivilegeUrl: host + '/uum/user/mgr/{id}/role-privilege/{defaultRoleId}',
      saveRowPrivilegeUrl: host + '/uum/user/mgr/{id}/row-privilege/{privilegeScope}'
    },

    moduleMgr: {
      url: host + '/platform/module/mgr',
      disEnableUrl: host + '/platform/module/mgr/{id}/disEnable/{disEnableFlag}',
      childNodesUrl: host + '/platform/module/mgr/{id}/child/nodes',
      operationUrl: host + '/platform/module/mgr/{id}/operation',
      resourceUrl: host + '/platform/module/mgr/{id}/resource',
      saveModuleOptRefsUrl: host + '/platform/module/mgr/{id}/module-opt-ref',
      saveModuleResRefsUrl: host + '/platform/module/mgr/{id}/module-res-ref',
    },
    operateMgr: {
      url: host + '/platform/operate/mgr',
      disEnableUrl: host + '/platform/operate/mgr/{id}/disEnable/{disEnableFlag}',
    },
    resourceMgr: {
      url: host + '/platform/resource/mgr',
      disEnableUrl: host + '/platform/resource/mgr/{id}/disEnable/{disEnableFlag}',
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
      url: host + '/platform/code/mgr',
      disEnableUrl: host + '/platform/code/mgr/{id}/disEnable/{disEnableFlag}'
    },
    districtMgr: {
      url: host + '/platform/district/mgr',
      childNodesUrl: host + '/platform/district/mgr/{id}/child/nodes',
      disEnableUrl: host + '/platform/district/mgr/{id}/disEnable/{disEnableFlag}'
    },
    dictionaryMgr: {
      url: host + '/platform/system/dictionary/mgr/',
      smallTypeUrl: host + '/platform/system/dictionary/mgr/{bigTypeCode}/small-type',
      disEnableUrl: host + '/platform/system/dictionary/mgr/{id}/disEnable/{disEnableFlag}'
    },
    schedulerMgr: {
      url: host + '/platform/system/scheduler/mgr',
      disEnableUrl: host + '/platform/system/scheduler/mgr/{id}/disEnable/{disEnableFlag}',
      startJobUrl: host + '/platform/system/scheduler/mgr/{id}/start-job',
      stopJobUrl: host + '/platform/system/scheduler/mgr/{id}/stop-job',
      startSchedulerUrl: host + '/platform/system/scheduler/mgr/start-scheduler',
      stopSchedulerUrl: host + '/platform/system/scheduler/mgr/stop-scheduler',
      schedulerStatusUrl: host + '/platform/system/scheduler/mgr/scheduler-status'
    },
    systemConfigMgr: {
      url: host + '/platform/system/config/mgr',
      userUrl: host + '/platform/system/config/mgr/users',
      startJConsoleUrl: host + '/platform/system/config/mgr/start-jconsole',
    },
    systemLogMgr: {
      url: host + '/platform/system/log/mgr',
    },
    systemParameterMgr: {
      url: host + '/platform/system/parameter/mgr',
      disEnableUrl: host + '/platform/system/parameter/mgr/{id}/disEnable/{disEnableFlag}',
    }
  }

  window.api = api;
});