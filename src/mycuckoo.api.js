export const API_HOST = 'http://localhost:8080';
export const FLOW_HOST = 'http://localhost:8082';

export const RESOURCES = {
  afficheMgr: {
    view: 'res:afficheMgr:view',
    deleteAttachment: 'res:afficheMgr:deleteAttachment'
  },
  codeMgr: {
    view: 'res:codeMgr:view'
  },
  deptMgr: {
    view: 'res:deptMgr:view',
    tree: 'res:deptMgr:tree'
  },
  dictionaryMgr: {
    view: 'res:dictionaryMgr:view'
  },
  districtMgr: {
    view: 'res:districtMgr:view',
    tree: 'res:districtMgr:tree'
  },
  moduleMgr: {
    add: 'res:moduleMgr:add',
    view: 'res:moduleMgr:view',
    tree: 'res:moduleMgr:tree',
    resSelector: 'res:moduleMgr:resSelector'
  },
  operateMgr: {
    add: 'res:operateMgr:add',
    view: 'res:operateMgr:view',
    selector: 'res:operateMgr:selector'
  },
  organMgr: {
    view: 'res:organMgr:view',
    tree: 'res:organMgr:tree'
  },
  resourceMgr: {
    view: 'res:resourceMgr:view',
    selector: 'res:resourceMgr:selector'
  },
  roleMgr: {
    list: 'res:roleMgr:list',
    view: 'res:roleMgr:view',
    resSelector: 'res:roleMgr:resSelector',
    assignRes: 'res:roleMgr:assignRes',
    assignRow: 'res:roleMgr:assignRow'
  },
  schedulerMgr: {
    view: 'res:schedulerMgr:view'
  },
  systemConfigMgr: {
    prefix: 'res:systemConfigMgr:',
    modify: 'res:systemConfigMgr:modify',
    selector: 'res:systemConfigMgr:selector'
  },
  systemParameterMgr: {
    add: 'res:systemParameterMgr:add',
    view: 'res:systemParameterMgr:view'
  },
  userMgr: {
    list: 'res:userMgr:list',
    view: 'res:userMgr:view',
    modifyPhoto: 'res:userMgr:modifyPhoto',
    modifyPassword: 'res:userMgr:modifyPassword',
    selector: 'res:userMgr:selector',
    resSelector: 'res:userMgr:resSelector',
    rowSelector: 'res:userMgr:rowSelector',
    assignRes: 'res:userMgr:assignRes',
    assignRow: 'res:userMgr:assignRow'
  },
  flowMgr: {
    defView: 'res:flowDefinitionMgr:view',
    defVariable: 'res:flowDefinitionMgr:variable',
    instanceView: 'res:flowInstanceMgr:view'
  }
};

const PLACEHOLDER = /\{(\w+)\}/g;

function getResponseMsg(xhr, fallback) {
  if (xhr && xhr.responseJSON && typeof xhr.responseJSON.msg !== 'undefined') {
    return xhr.responseJSON.msg;
  }

  return fallback || '请求失败，请稍后重试';
}

function resolvePlaceholder(uri, uriVariables = {}) {
  return String(uri || '').replace(PLACEHOLDER, function(_, key) {
    return Object.prototype.hasOwnProperty.call(uriVariables, key)
      ? encodeURIComponent(String(uriVariables[key]))
      : '';
  });
}

function hasPlaceholder(uri) {
  return /\{\w+\}/.test(String(uri || ''));
}

function normalizeParams(uriVariables, params) {
  return typeof params === 'undefined' ? uriVariables : params;
}

function toJsonPayload(params) {
  return typeof params === 'string' ? params : JSON.stringify(params);
}

function createApiUrlGuard(global, host) {
  const apiOrigin = new URL(host, global.location.href).origin;

  return function isAllowedApiUrl(url) {
    try {
      //TODO 不同端口有问题
      return true;
      // return new URL(url, global.location.href).origin === apiOrigin;
    } catch (e) {
      return false;
    }
  };
}

function getActionUrl(action = {}, host = API_HOST, flowHost = FLOW_HOST) {
  if (action.url) {
    return action.url;
  }

  const path = action.path || '';
  return (path.startsWith('/flow/mgr') ? flowHost : host) + path;
}

function configureAjax($, global, layer, host) {
  const isAllowedApiUrl = createApiUrlGuard(global, host);

  $.ajaxSetup({
    type: 'POST',
    xhrFields: { withCredentials: true },
    statusCode: {
      401: function(xhr) {
        layer.closeAll();
        layer.open({
          title: '未登录',
          content: getResponseMsg(xhr, '登录状态已失效'),
          end: function() {
            top.parent.location.href = parent.location.protocol + '/login.html';
          }
        });
      },
      403: function(xhr) {
        layer.open({ title: '警告', content: getResponseMsg(xhr, '无权限执行当前操作') });
      },
      405: function(xhr) {
        layer.open({ title: '错误', content: getResponseMsg(xhr, '不支持的请求方法') });
      },
      500: function(xhr) {
        layer.open({ title: '错误', content: getResponseMsg(xhr, '服务异常，请稍后重试') });
      }
    },
    beforeSend: function(xhr, settings) {
      const mycuckoo = global.MyCuckoo;
      const token = mycuckoo && typeof mycuckoo.getSession === 'function' ? mycuckoo.getSession('token') : '';

      if (token && settings && settings.url && isAllowedApiUrl(settings.url)) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    },
    error: function(xhr) {
      layer.open({ title: '错误', content: getResponseMsg(xhr, '系统错误') });
      console.log(xhr);
    }
  });
}

function installHttpHelpers($, host) {
  const baseGet = $._mycuckooBaseGet || $.get;
  $._mycuckooBaseGet = baseGet;

  $.request = function(action, uriVariables, params) {
    if (!action || !action.canAccess()) {
      throw new Error(action ? '无权访问此资源:"' + action.code + '"' : '无权访问此资源');
    }

    const method = String(action.method || '').toLowerCase();
    const url = getActionUrl(action, host);

    if (method === 'get') {
      return $.get(url, uriVariables, params);
    } else if (method === 'post') {
      return $.postJson(url, uriVariables, params);
    } else if (method === 'put') {
      return $.put(url, uriVariables, params);
    } else if (method === 'delete') {
      return $.delete(url, uriVariables, params);
    }

    return {};
  };

  $.get = function(url, uriVariables, params) {
    const finalParams = normalizeParams(uriVariables, params);
    const finalUrl = hasPlaceholder(url) ? resolvePlaceholder(url, uriVariables) : url;

    return baseGet(finalUrl, finalParams);
  };

  $.postJson = function(url, uriVariables, params) {
    const finalParams = normalizeParams(uriVariables, params);
    const finalUrl = hasPlaceholder(url) ? resolvePlaceholder(url, uriVariables) : url;

    return $.ajax({
      url: finalUrl,
      contentType: 'application/json;charset=UTF-8',
      data: toJsonPayload(finalParams)
    });
  };

  $.put = function(url, uriVariables, params) {
    const finalParams = normalizeParams(uriVariables, params);
    const finalUrl = hasPlaceholder(url) ? resolvePlaceholder(url, uriVariables) : url;

    return $.ajax({
      url: finalUrl,
      type: 'PUT',
      contentType: 'application/json;charset=UTF-8',
      data: toJsonPayload(finalParams)
    });
  };

  $.delete = function(url, uriVariables, params) {
    const finalParams = normalizeParams(uriVariables, params);
    const finalUrl = hasPlaceholder(url) ? resolvePlaceholder(url, uriVariables) : url;

    return $.ajax({
      url: finalUrl,
      type: 'DELETE',
      contentType: 'application/json;charset=UTF-8',
      data: toJsonPayload(finalParams)
    });
  };
}

export function createMyCuckooApi($, options = {}) {
  const host = options.host || API_HOST;
  const flowHost = options.flowHost || FLOW_HOST;

  return {
    host: host,

    getUrl(resourceObj = {}) {
      return getActionUrl(resourceObj, host, flowHost);
    },

    postRegister(params) {
      return $.postJson(host + '/register', params);
    },

    postLogin(params) {
      return $.post(host + '/login', params);
    },

    postOrg(params) {
      return $.postJson(host + '/login/orgs', params);
    },

    postMenu(params) {
      return $.post(host + '/login/menus', params).then(res => res.data);
    },

    getLogout() {
      return $.get(host + '/login/logout');
    },

    postTable(params) {
      return $.postJson(host + '/platform/config/list-table-config?tableCode={code}', params);
    },

    getDict(params) {
      return $.get(host + '/platform/system/dictionary/mgr/items', params);
    },

    fileMgr: {
      url: host + '/file'
    }
  };
}

export function installMyCuckooApi(global = window, options = {}) {
  const layui = global.layui;

  layui.use(['jquery'], function() {
    const $ = layui.jquery;
    const layer = layui.layer || global.layer;
    const host = options.host || API_HOST;

    configureAjax($, global, layer, host);
    installHttpHelpers($, host);

    global.MyCuckoo = $.extend(global.MyCuckoo || {}, {
      api: createMyCuckooApi($, options),
      res: RESOURCES
    });
  });
}
