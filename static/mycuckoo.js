(function(global) {
  layui.config({
    base: '../../static/extend/',
    version: '4.1.1'
  });

  layui.use(['jquery', 'layer'], function() {
    const $ = layui.jquery;
    const MyCuckoo = {
      tableHeight: 'full-55',

      /**
       * 设置会话信息
       */
      setSession: function(key, value) {
        if (typeof value == 'object') {
          sessionStorage.setItem(key, JSON.stringify(value));
        } else {
          sessionStorage.setItem(key, value);
        }
      },

      /**
       * 获取会话信息
       */
      getSession: function(key) {
        let value = sessionStorage.getItem(key);
        if (typeof value == 'string' && (value.charAt(0) == '{' || value.charAt(0) == '[')) {
          return JSON.parse(value);
        }

        return value;
      },

      /**
       * 获取会话操作按钮
       */
      getOperation: function(key) {
        let menu = this.getSession('myMenu');
        if (menu && menu.fourth) {
          return menu.fourth[key] || [];
        }

        return null || [];
      },

      getIndexAction: function (operator) {
        return operator.findLast(o => (o['group'] & 1) === 1);
      },

      getActions: function(operator, where) {
        let position = {
          index: 1,
          table: 2,
          col: 4,
          more: 4,
          form: 8,
          hide: 1 << 9
        };
        let arr = [];
        let mode = position[where];

        if (where === 'table') {
          arr.push('<div>');
          arr.push('<div class="layui-btn-group btn-toolbar">');
          operator.forEach((item, index) => {
            if ((item.group & mode) !== mode) return;

            arr.push('<button class="layui-btn layui-btn-sm" lay-event="' + item.code + '">');
            arr.push('<i class="layui-icon layui-icon-' + item.iconCls + '"></i>' + item.name);
            arr.push('</button>')
          });
          arr.push('</div>');
          arr.push('</div>');
        } else if (where === 'col') {
          let i = 0;
          let count = 0;
          operator.forEach((item, index) => {
            if ((item.group & mode) === mode) {
              count++;
            }
          });

          arr.push('<div>');
          arr.push('<div class="layui-clear-space">');
          operator.forEach((item, index) => {
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
          arr.push('</div>');
          arr.push('</div>');
        } else if (where === 'form') {
          let item = operator;

          arr.push('<div>');
          arr.push('<div class="layui-btn-container" style="margin-bottom: 6px; text-align: center;">');
          if ((item.group & mode) === mode) {
            arr.push('<a href="javascript: " class="layui-btn layui-btn-sm" data-event="' + item.code + '" lay-submit>');
            arr.push('<i class="layui-icon layui-icon-ok"></i>' + item.name);
            arr.push('</a>');
          }
          arr.push('<a href="javascript: " class="layui-btn layui-btn-sm" data-event="close">');
          arr.push('<i class="layui-icon layui-icon-close"></i>关闭');
          arr.push('</a>');
          arr.push('</div>');
          arr.push('</div>');
        } else if (where === 'more') {
          let i = 0;
          operator.forEach((item, index) => {
            if ((item.group & mode) != mode || i++ == 0) {
              return;
            }
            arr.push(item);
          });

          return arr;
        }

        return arr.join('');
      },

      /**
       * 解析链接占位符变量：http://localhost?id={id}, {'id': 1} => http://localhost?id=1
       *
       * @return 最终链接
       */
      resolve: function(uri, uriVariables) {
        return this.resolvePlaceholder(uri, uriVariables);
      },

      /**
       * 解析链接占位符变量：http://localhost?id={id}, {'id': 1} => http://localhost?id=1
       *
       * @return 最终链接
       */
      resolvePlaceholder: function(uri, uriVariables) {
        let path = uri;
        for (let variable in uriVariables) {
          let witch = typeof variable;
          if ("string" == witch || 'number' == witch) {
            path = path.replace('{' + variable + '}', uriVariables[variable]);
          }
        }

        return path;
      },

      /**
       * 转换查询字符串为json对象, 如: width=1680&height=1050 => {width : "1680", height : "1050"}
       *
       * @param queryString 查询字符串
       * @return json对象
       */
      fromQueryString: function (queryString) {
        if (!queryString) return {};
        if (queryString.charAt(0) == '?') {
          queryString = queryString.substring(1);
        }
        queryString = decodeURIComponent(queryString);

        let obj = {};
        let arr = queryString.split('&');
        for (let i = 0, len = arr.length; i < len; i++) {
          let nameValues = arr[i].split('=');
          obj[nameValues[0]] = nameValues[1];
        }

        return obj;
      },

      /**
       * 获取当前页链接查询字符串的对象表示：http://localhost?search=word => {search: 'word'}
       *
       * @return json对象
       */
      getQueryObject: function (url) {
        return this.fromQueryString(url);
      },

      /**
       * 字典数组转换map对象
       */
      getDictMap: function (dicts) {
        let map = {}
        if (dicts.constructor !== Array) {
          return dicts
        }

        for (let i in dicts) {
          map[dicts[i].code] = dicts[i];
        }

        return map;
      },

      /**
       * 将json对象转换为json字符串, 请参看jQuery.serializeArray()返回的数据格式
       *
       * @param obj 对象
       * @returns json 字符串
       * @deprecated
       */
      toJSON: function (obj) {
        let json = null;
        if (typeof obj == 'object') { // 对象
          json = '{'; // 开始
          if ($.isArray(obj)) { // jQuery.serializeArray() 方法得到的form表单数组对象
            for (let i = 0, len = obj.length; i < len; i++) {
              if (i > 0) json += ',';
              json += '"' + obj[i].name + '":"' + (obj[i].value ? obj[i].value : '') + '"';
            }
          } else {
            let flag = false;
            for (let p in obj) {
              flag ? (json += ',') : (flag = true);
              json += '"' + p + '":"' + obj[p] + '"';
            }
          }
          json += '}'; // 结束
        }

        return json;
      },

      /**
       * 将源对象的'属性-值'复制到目标对象
       *
       * @param destObj 目标对象
       * @param srcObj 源对象
       */
      apply: function (destObj, srcObj) {
        if (destObj && typeof srcObj == 'object') {
          for (let p in srcObj) {
            destObj[p] = srcObj[p];
          }
        }
        return destObj;
      },

      /**
       * 深度克隆对象
       *
       * @param obj 对象
       * @return cloneObj 克隆对象
       */
      cloneObject: function (obj) {
        let o = obj.constructor === Array ? [] : {};
        for (let i in obj) {
          if (obj.hasOwnProperty(i)) {
            o[i] = typeof obj[i] === 'object' ? MyCuckoo.cloneObject(obj[i]) : obj[i];
          }
        }

        return o;
      },

      /**
       * 提示信息
       * @param config对象: {title: 'youTitle', msg: 'youMsg', duration: 1000}
       *    duration 表示信息多久后消失, 单位毫秒
       *
       * @param config  json对象
       */
      msg: function (config) {
        if (typeof config != 'object') {
          config = {msg: '正在处理中, 请稍等...'};
        }

        layer.msg(config.msg);
      },

      /**
       * 信息提示框, config对象应提供 'title' 和 'msg' 两个属性
       *
       * @param config  json对象
       */
      alert: function (config) {
        config.title = config.title || '提示';

        let index = layer.alert(config.msg, config);
        setTimeout(function () {
          layer.close(index);
        }, (config.duration || 2000));
      },

      /**
       * 弹出dialog
       *
       * @param config  json对象
       * {title : '提示', msg: '确定要执行当前操作吗?', okBtn: '确定', cancelBtn: '取消', ok: function() {}, cancel: function() {}}
       */
      confirm: function (config) {
        if (typeof config != 'object') {
          config = {
            title: '提示', msg: '确定要执行当前操作吗?', okBtn: '确定', cancelBtn: '取消', ok: function () {
            }, cancel: function () {
            }
          };
        }
        let title = config.title || '提示';
        let msg = config.msg || '确定要执行当前操作吗';
        let okBtn = config.okBtn || '确定';
        let cancelBtn = config.cancelBtn || '';
        let options = {
          title: title,
          content: msg,
          btn: [okBtn],
          yes: function (index, layero) {
            try {
              config.ok();
            } catch (e) {
              // do something...
            }

            layer.close(index);
          },
        }
        if (cancelBtn != '') {
          options.btn.push(cancelBtn);
          options.btn2 = function (index, layero) {
            try {
              config.cancel();
            } catch (e) {
              // do something...
            }

            layer.close(index);
          }
        }
        if (config.end) {
          options.end = config.end;
        }

        layer.open(options);
      },

      /**
       * 参数解释：
       * title   标题
       * url     请求的url
       * w       弹出层宽度（缺省调默认值）
       * h       弹出层高度（缺省调默认值）
       */
      dialog: function (title, url, w, h) {
        let full = !w;
        if (title == null || title == '') {
          title = false;
        }
        if (url == null || url == '') {
          url = '404.html';
        }
        if (w == null || w == '') {
          w = ($(window).width() * 0.5);
        }
        if (h == null || h == '') {
          h = ($(window).height() - 120);
        }
        layer.open({
          type: 2,
          skin: 'layui-bg-gray',
          area: [w + 'px', h + 'px'],
          fix: true, //固定
          maxmin: false,
          shadeClose: false,
          shade: 0.4,
          resize: false,
          move: false,
          title: title,
          content: url,
          success: function (layero, index) {
            full && layer.full(index)
          },
          error: function (layero, index) {
            alert('失败了');
          }
        });
      },

      /**
       * 参数解释：
       * title   标题
       * url     请求的url
       */
      sideDialog: function (title, url) {
        if (title == null || title == '') {
          title = false;
        }
        if (url == null || url == '') {
          url = '404.html';
        }
        layer.open({
          type: 2,
          skin: 'layui-bg-gray',
          area: ['480px', '100%'],
          fix: true, //固定
          maxmin: false,
          shadeClose: true,
          shade: 0.4,
          resize: false,
          move: false,
          offset: 'r',
          anim: 'slideLeft', // 从上往下
          title: title,
          content: url,
          success: function (layero, index) {

          },
          error: function (layero, index) {
            alert('失败了');
          }
        });
      }
      //
    }

    global.MyCuckoo = $.extend(global.MyCuckoo || {}, MyCuckoo);
  });

})(window)
