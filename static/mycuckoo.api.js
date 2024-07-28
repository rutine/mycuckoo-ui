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

    postRegister: function(params) {
      return $.postJson(host + '/register', params);
    },
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

    deptMgr: {
      url: host + '/uum/dept/mgr',
      childNodesUrl: host + '/uum/dept/mgr/{id}/child/nodes',
      disEnableUrl: host + '/uum/dept/mgr/{id}/disEnable/{disEnableFlag}'
    },
    userMgr: {
      url: host + '/uum/user/mgr',
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
    fileMgr: {
      url: host + '/file'
    }
  }

  var MyCuckoo = window.MyCuckoo || {}
  MyCuckoo.api = api;

  window.MyCuckoo = MyCuckoo;
});