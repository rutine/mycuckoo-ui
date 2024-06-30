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
          content: xhr.responseJSON.msg,
          end: function () {
            top.parent.location.href = parent.location.protocol + '/login.html';
          },
        });
      },
      403: function(xhr) {
        layer.open({title: '警告', content: xhr.responseJSON.msg});
      },
      500: function(xhr) {
        layer.open({title: '错误', content: xhr.responseJSON.msg});
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
      if ('string' == witch || 'number' == witch) {
        path = path.replace('{' + variable + '}', uriVariables[variable]);
      }
    }

    return path;
  }

  var $get = $.get;
  $.request = function(action, uriVariables, params) {
    if (!action) {
      throw new Error('无权访问此资源');
    }

    var method = action.method.toLowerCase();
    var url = action.url ? action.url : (host + action.path);
    if (method === 'get') {
      return $.get(url, uriVariables, params);
    } else if (method === 'post') {
      return $.postJson(url, uriVariables, params);
    } else if (method === 'put') {
      return $.put(url, uriVariables, params);
    } else if (method === 'delete') {
      return $.delete(url, uriVariables, params);
    }

    return {}
  }

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

    postLogin: function(params) {
      return $.post(host + '/login', params);
    },
    postOrg: function(params) {
      return $.postJson(host + '/login/orgs', params);
    },
    postMenu: function(params) {
      return $.post(host + '/login/menus', params).then(res => res.data);
    },
    getLogout: function() {
      return $.get(host + '/login/logout');
    },
    postTable: function (params) {
      return $.postJson(host + '/platform/config/list-table-config?tableCode={code}', params);
    },
    getDict: function (params) {
      return $.get(host + '/platform/system/dictionary/mgr/small-type', params);
    },

    //公共
    configMgr: {
      tableConfigUrl: host + '/platform/config/list-table-config',
    },

    organMgr: {
      url: host + '/uum/organ/mgr',
      childNodesUrl: host + '/uum/organ/mgr/{id}/child/nodes',
      disEnableUrl: host + '/uum/organ/mgr/{id}/disEnable/{disEnableFlag}',
    },
    roleMgr: {
      url: host + '/uum/role/mgr',
      disEnableUrl: host + '/uum/role/mgr/{id}/disEnable/{disEnableFlag}',
      rolePrivilegeUrl: host + '/uum/role/mgr/{id}/role-privilege',
      saveOptPrivilegeUrl: host + '/uum/role/mgr/{id}/opt-privilege/{privilegeScope}',
      saveRowPrivilegeUrl: host + '/uum/role/mgr/{id}/row-privilege',
    },
    deptMgr: {
      url: host + '/uum/dept/mgr',
      childNodesUrl: host + '/uum/dept/mgr/{id}/child/nodes',
      disEnableUrl: host + '/uum/dept/mgr/{id}/disEnable/{disEnableFlag}',
      assignUrl: host + '/uum/dept/mgr/{id}/assign',
    },
    userMgr: {
      url: host + '/uum/user/mgr',
      selectorUrl: host + '/uum/user/mgr/selector',
      updatePhoto: host + '/uum/user/mgr/update/photo',
      updatePwdUrl: host + '/uum/user/mgr/update/password',
      updateRoleUrl: host + '/uum/user/mgr/update/role',
      resetPwdUrl: host + '/uum/user/mgr/{id}/reset-password',
      disEnableUrl: host + '/uum/user/mgr/{id}/disEnable/{disEnableFlag}',
      resPrivilegeUrl: host + '/uum/user/mgr/{id}/res-privilege',
      rowPrivilegeUrl: host + '/uum/user/mgr/{id}/row-privilege',
      saveOptPrivilegeUrl: host + '/uum/user/mgr/{id}/opt-privilege/{privilegeScope}',
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
    tableConfigMgr: {
      url: host + '/platform/table-config/mgr',
      listUrl: host + '/platform/table-config/mgr/{moduleId}/list',
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
      smallTypeMapUrl: host + '/platform/system/dictionary/mgr/small-type',
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

  var MyCuckoo = window.MyCuckoo || {}
  MyCuckoo.api = api;

  window.MyCuckoo = MyCuckoo;
});