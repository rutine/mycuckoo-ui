(function(global) {
  layui.use(['jquery'], function () {
    const $ = layui.jquery;
    const host = 'http://localhost:8080';
    const apiOrigin = new URL(host, global.location.href).origin;

    const getResponseMsg = function(xhr, fallback) {
      if (xhr && xhr.responseJSON && typeof xhr.responseJSON.msg !== 'undefined') {
        return xhr.responseJSON.msg;
      }

      return fallback || '请求失败，请稍后重试';
    }

    const isAllowedApiUrl = function(url) {
      try {
        return new URL(url, global.location.href).origin === apiOrigin;
      } catch (e) {
        return false;
      }
    }

    $.ajaxSetup({
      type: 'POST',
      //contentType: 'application/json',
      // dataType: 'json',
      xhrFields: { withCredentials: true },
      statusCode: {
        401: function(xhr) {
          layer.closeAll();
          layer.open({
            title: '未登录',
            content: getResponseMsg(xhr, '登录状态已失效'),
            end: function () {
              top.parent.location.href = parent.location.protocol + '/login.html';
            },
          });
        },
        403: function(xhr) {
          layer.open({title: '警告', content: getResponseMsg(xhr, '无权限执行当前操作')});
        },
        500: function(xhr) {
          layer.open({title: '错误', content: getResponseMsg(xhr, '服务异常，请稍后重试')});
        }
      },
      beforeSend: function(xhr, settings) {
        if (MyCuckoo.getSession('token') && settings && settings.url && isAllowedApiUrl(settings.url)) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + MyCuckoo.getSession('token'));
        }
      },
      error: function(xhr, status, thrown) {
        console.log(xhr);
      }
    });

    const placeholder = /\{(\w+)\}/;
    const resolvePlaceholder = function(uri, uriVariables) {
      let path = uri;
      const variables = uriVariables || {};
      Object.keys(variables).forEach(function(variable) {
        let witch = typeof variable;
        if ('string' == witch || 'number' == witch) {
          path = path.replace('{' + variable + '}', encodeURIComponent(String(variables[variable])));
        }
      });

      return path;
    }

    const $get = $.get;
    $.request = function(action, uriVariables, params) {
      if (!action) {
        throw new Error('无权访问此资源');
      }

      let method = action.method.toLowerCase();
      let url = action.url ? action.url : (host + action.path);
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

    const api = {
      host: host,

      getUrl: function (resourceObj = {}) {
        if (resourceObj.url) {
          return resourceObj.url;
        }

        return (resourceObj.path && resourceObj.path.startsWith('/flow/mgr') ? 'http://localhost:8082' : host) + resourceObj.path
      },
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

    global.MyCuckoo = $.extend(global.MyCuckoo || {}, {api: api});
  });
})(window)
