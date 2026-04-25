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

export function resolvePlaceholder(uri, uriVariables = {}) {
  return String(uri || '').replace(/\{(\w+)\}/g, function(_, key) {
    return getOwn(uriVariables, key) ? encodeURIComponent(String(uriVariables[key])) : '';
  });
}

export function fromQueryString(queryString) {
  const search = String(queryString || '').replace(/^\?/, '');
  const params = new URLSearchParams(search);
  const obj = {};

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

export function createMyCuckoo(global = window) {
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

    resolve: resolvePlaceholder,
    resolvePlaceholder: resolvePlaceholder,

    fromQueryString: fromQueryString,

    getQueryObject(url) {
      return this.fromQueryString(url);
    },

    getDictMap(dicts) {
      if (!Array.isArray(dicts)) {
        return dicts;
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

export function installMyCuckoo(global = window) {
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
