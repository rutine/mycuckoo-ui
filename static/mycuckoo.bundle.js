(function () {
  'use strict';

  const ACTION_GROUP = {
    index: 1,
    table: 2,
    col: 4,
    more: 4,
    form: 8,
    hide: 1 << 9
  };

  function getLayui(global) {
    return global.layui;
  }

  function getJquery(global) {
    const layui = getLayui(global);
    return layui.jquery || layui.$;
  }

  function getLayer(global) {
    return getLayui(global).layer || global.layer;
  }

  function isJsonLike(value) {
    return typeof value === 'string' && /^[\[{]/.test(value.trim());
  }

  function safeParseJson(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  function getOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function resolvePlaceholder$1(uri, uriVariables = {}) {
    return String(uri || '').replace(/\{(\w+)\}/g, function(_, key) {
      return getOwn(uriVariables, key) ? encodeURIComponent(String(uriVariables[key])) : '';
    });
  }

  function fromQueryString(queryString) {
    const search = String(queryString || '').replace(/^\?/, '');
    const params = new URLSearchParams(search);
    const obj = {
      action: '',
      method: '',
      url: '',
      path: ''
    };

    params.forEach(function(value, key) {
      obj[key] = value;
    });

    return obj;
  }

  function cloneObject(obj) {
    if (obj == null || typeof obj !== 'object') {
      return obj;
    }

    if (typeof structuredClone === 'function') {
      return structuredClone(obj);
    }

    return JSON.parse(JSON.stringify(obj));
  }

  function renderTableActions(operator, mode) {
    const arr = ['<div>', '<div class="layui-btn-group btn-toolbar">'];

    operator.forEach(item => {
      if ((item.group & mode) !== mode) return;

      arr.push('<button class="layui-btn layui-btn-sm" lay-event="' + item.code + '">');
      arr.push('<i class="layui-icon layui-icon-' + item.iconCls + '"></i>' + item.name);
      arr.push('</button>');
    });

    arr.push('</div>', '</div>');
    return arr.join('');
  }

  function renderColActions(operator, mode) {
    const arr = ['<div>', '<div class="layui-clear-space">'];
    let i = 0;

    operator.forEach(item => {
      if ((item.group & mode) !== mode) {
        return;
      } else if (i === 0) {
        arr.push('<a class="layui-btn layui-btn-xs" lay-event="' + item.code + '">');
        arr.push('<i class="layui-icon layui-icon-' + item.iconCls + '"></i>' + item.name);
        arr.push('</a>');
      } else if (i === 1) {
        arr.push('<a class="layui-btn layui-btn-xs" lay-event="more">更多');
        arr.push('<i class="layui-icon layui-icon-down"></i>');
        arr.push('</a>');
      }
      i++;
    });

    arr.push('</div>', '</div>');
    return arr.join('');
  }

  function renderFormActions(operator, mode) {
    const item = operator;
    const arr = ['<div>', '<div class="layui-btn-container" style="margin-bottom: 6px; text-align: center;">'];

    if ((item.group & mode) === mode) {
      arr.push('<a href="javascript: " class="layui-btn layui-btn-sm" data-event="' + item.code + '" lay-submit>');
      arr.push('<i class="layui-icon layui-icon-ok"></i>' + item.name);
      arr.push('</a>');
    }

    arr.push('<a href="javascript: " class="layui-btn layui-btn-sm" data-event="close">');
    arr.push('<i class="layui-icon layui-icon-close"></i>关闭');
    arr.push('</a>');
    arr.push('</div>', '</div>');

    return arr.join('');
  }

  function getMoreActions(operator, mode) {
    const arr = [];
    let i = 0;

    operator.forEach(item => {
      if ((item.group & mode) !== mode || i++ === 0) {
        return;
      }
      arr.push(item);
    });

    return arr;
  }

  function createMyCuckoo(global = window) {
    return {
      tableHeight: 'full-55',

      setSession(key, value) {
        sessionStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
      },

      getSession(key) {
        const value = sessionStorage.getItem(key);
        return isJsonLike(value) ? safeParseJson(value) : value;
      },

      getResource(key) {
        const menu = this.getSession('myMenu');
        if (menu && menu.fourth) {
          return menu.fourth[key] || [];
        }

        return [];
      },

      getResourceMap() {
        const menu = this.getSession('myMenu');
        const map = Object.create(null);

        if (menu && menu.fourth) {
          Object.values(menu.fourth).forEach(resources => {
            (resources || []).forEach(resource => {
              map[resource.code] = resource;
            });
          });
        }

        return map;
      },

      getMainResource(operator = []) {
        for (let i = operator.length - 1; i >= 0; i--) {
          if ((operator[i].group & ACTION_GROUP.index) === ACTION_GROUP.index) {
            return operator[i];
          }
        }

        return null;
      },

      getActions(operator, where) {
        const mode = ACTION_GROUP[where];

        if (where === 'table') {
          return renderTableActions(operator, mode);
        } else if (where === 'col') {
          return renderColActions(operator, mode);
        } else if (where === 'form') {
          return renderFormActions(operator, mode);
        } else if (where === 'more') {
          return getMoreActions(operator, mode);
        }

        return '';
      },

      resolve: resolvePlaceholder$1,
      resolvePlaceholder: resolvePlaceholder$1,

      fromQueryString: fromQueryString,

      getQueryObject(url) {
        return this.fromQueryString(url);
      },

      getDictMap(dicts) {
        if (!Array.isArray(dicts)) {
          return dicts || {};
        }

        return dicts.reduce(function(map, item) {
          map[item.code] = item;
          return map;
        }, {});
      },

      cloneObject: cloneObject,

      msg(config) {
        const layer = getLayer(global);
        const options = typeof config === 'object' ? config : { msg: '正在处理中, 请稍等...' };
        layer.msg(options.msg);
      },

      alert(config = {}) {
        const layer = getLayer(global);
        const options = Object.assign({ title: '提示' }, config);
        const index = layer.alert(options.msg, options);

        setTimeout(function() {
          layer.close(index);
        }, options.duration || 2000);
      },

      confirm(config) {
        const layer = getLayer(global);
        const options = typeof config === 'object' ? config : {
          title: '提示',
          msg: '确定要执行当前操作吗?',
          okBtn: '确定',
          cancelBtn: '取消',
          ok: function() {},
          cancel: function() {}
        };

        const openOptions = {
          title: options.title || '提示',
          content: options.msg || '确定要执行当前操作吗',
          btn: [options.okBtn || '确定'],
          yes: function(index) {
            try {
              if (typeof options.ok === 'function') {
                options.ok();
              }
            } catch (e) {}

            layer.close(index);
          }
        };

        if (options.cancelBtn) {
          openOptions.btn.push(options.cancelBtn);
          openOptions.btn2 = function(index) {
            try {
              if (typeof options.cancel === 'function') {
                options.cancel();
              }
            } catch (e) {}

            layer.close(index);
          };
        }

        if (options.end) {
          openOptions.end = options.end;
        }

        layer.open(openOptions);
      },

      dialog(title, url, w, h) {
        const $ = getJquery(global);
        const layer = getLayer(global);
        const full = !w;
        const width = w || ($(global).width() * 0.5);
        const height = h || ($(global).height() - 120);

        layer.open({
          type: 2,
          skin: 'layui-bg-gray',
          area: [width + 'px', height + 'px'],
          fix: true,
          maxmin: false,
          shadeClose: false,
          shade: 0.4,
          resize: false,
          move: false,
          title: title || false,
          content: url || '404.html',
          success: function(layero, index) {
            if (full) {
              layer.full(index);
            }
          },
          error: function() {
            alert('失败了');
          }
        });
      },

      sideDialog(title, url) {
        const layer = getLayer(global);

        layer.open({
          type: 2,
          skin: 'layui-bg-gray',
          area: ['480px', '100%'],
          fix: true,
          maxmin: false,
          shadeClose: true,
          shade: 0.4,
          resize: false,
          move: false,
          offset: 'r',
          anim: 'slideLeft',
          title: title || false,
          content: url || '404.html',
          success: function() {},
          error: function() {
            alert('失败了');
          }
        });
      }
    };
  }

  function installMyCuckoo(global = window) {
    const layui = getLayui(global);

    layui.config({
      base: '../../static/extend/',
      version: '5.0.0'
    });

    layui.use(['jquery', 'layer'], function() {
      const $ = layui.jquery;
      global.MyCuckoo = $.extend(global.MyCuckoo || {}, createMyCuckoo(global));
    });
  }

  const API_HOST = 'http://localhost:8080';
  const FLOW_HOST = 'http://localhost:8082';

  const RESOURCES = {
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
      optSelector: 'res:moduleMgr:optSelector',
      resSelector: 'res:moduleMgr:resSelector'
    },
    operateMgr: {
      add: 'res:operateMgr:add',
      view: 'res:operateMgr:view'
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
    new URL(host, global.location.href).origin;

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
      if (!action) {
        throw new Error('无权访问此资源');
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

  function createMyCuckooApi($, options = {}) {
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
        return $.get(host + '/platform/system/dictionary/mgr/small-type', params);
      },

      fileMgr: {
        url: host + '/file'
      }
    };
  }

  function installMyCuckooApi(global = window, options = {}) {
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

  function toStr(value) {
    return (value === undefined || value === null) ? '' : String(value).trim();
  }

  function normalizeUsers(users) {
    if (!Array.isArray(users)) {
      return [];
    }

    return users
      .map(function(user) {
        const id = toStr(user && (user.id || user.userId || user.account));
        const name = toStr(user && (user.name || user.userName || user.account));

        if (!id) {
          return null;
        }

        return {
          id: id,
          name: name || id
        };
      })
      .filter(function(user) {
        return !!user;
      });
  }

  function buildUrl(url, requestId, data) {
    const safeData = data || {};
    const params = [
      ['requestId', requestId],
      ['ids', toStr(safeData.ids)],
      ['names', toStr(safeData.names)]
    ];
    const query = params
      .filter(function(entry) {
        return !!entry[1];
      })
      .map(function(entry) {
        return encodeURIComponent(entry[0]) + '=' + encodeURIComponent(entry[1]);
      })
      .join('&');

    if (!query) {
      return url;
    }

    return url + (url.indexOf('?') === -1 ? '?' : '&') + query;
  }

  function toLayerSize(value) {
    if (typeof value === 'number') {
      return value + 'px';
    }

    return toStr(value);
  }

  function createUserPicker(options = {}) {
    const layer = options.layer;
    const title = toStr(options.title) || '选择用户';
    const url = toStr(options.url) || './view/uum/userPicker.html';
    const width = toLayerSize(options.width || 960) || '960px';
    const height = toLayerSize(options.height || 640) || '640px';
    let seed = 0;
    const pending = Object.create(null);

    if (!layer || typeof layer.open !== 'function' || typeof layer.close !== 'function') {
      throw new Error('Layer API is required');
    }

    function resolvePending(requestId, users) {
      const record = pending[requestId];

      if (!record) {
        return false;
      }

      delete pending[requestId];
      record.resolve(normalizeUsers(users));
      return true;
    }

    function rejectPending(requestId, error) {
      const record = pending[requestId];

      if (!record) {
        return false;
      }

      delete pending[requestId];
      record.reject(new Error('User picker cancelled'));
      return true;
    }

    return function userPicker(data) {
      seed += 1;

      const requestId = 'modeler-user-picker-' + seed;

      return new Promise(function(resolve, reject) {
        const content = buildUrl(url, requestId, data && data.value ? data.value : data);

        layer.open({
          type: 2,
          skin: 'layui-bg-gray',
          area: [width, height],
          fix: true,
          maxmin: false,
          shadeClose: false,
          shade: 0.4,
          resize: false,
          move: false,
          title: title,
          content: content,
          beforeEnd: function(layero, index) {
            const result = layer.getChildFrame('#ID_selected_cache', index).attr('json');
            result ? resolvePending(requestId, JSON.parse(result)) : rejectPending(requestId);
            return true;
          },
          end: function() {
            if (!pending[requestId]) {
              return;
            }

            const record = pending[requestId];
            delete pending[requestId];
            record.reject(new Error('User picker cancelled'));
          }
        });

        pending[requestId] = {
          resolve: resolve,
          reject: reject
        };
      });
    };
  }

  function installUserPicker(global = window) {
    global.MyCuckoo = Object.assign(global.MyCuckoo || {}, {
      createUserPicker: createUserPicker
    });
  }

  installMyCuckoo(window);
  installUserPicker(window);
  installMyCuckooApi(window);

})();
