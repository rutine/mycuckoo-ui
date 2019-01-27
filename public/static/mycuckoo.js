layui.use(['jquery', 'layer'], function() {
  let $ = layui.jquery;
  let MyCuckoo = {
    /**
     * 获取当前页链接查询字符串的对象表示：http://localhost?search=word => {search: 'word'}
     *
     * @return json对象
     */
    resolvePlaceholder: function(uri, uriVariables) {
      var path = uri;
      for (var variable in uriVariables) {
        var witch = typeof variable;
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

      var obj = {};
      var arr = queryString.split('&');
      for (var i = 0, len = arr.length; i < len; i++) {
        var nameValues = arr[i].split('=');
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
     * 将json对象转换为json字符串, 请参看jQuery.serializeArray()返回的数据格式
     *
     * @param obj 对象
     * @returns json 字符串
     * @deprecated
     */
    toJSON: function (obj) {
      var json = null;
      if (typeof obj == 'object') { // 对象
        json = '{'; // 开始
        if ($.isArray(obj)) { // jQuery.serializeArray() 方法得到的form表单数组对象
          for (var i = 0, len = obj.length; i < len; i++) {
            if (i > 0) json += ',';
            json += '"' + obj[i].name + '":"' + (obj[i].value ? obj[i].value : '') + '"';
          }
        } else {
          var flag = false;
          for (var p in obj) {
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
        for (var p in srcObj) {
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
      var o = obj.constructor === Array ? [] : {};
      for (var i in obj) {
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

      var index = layer.alert(config.msg, config);
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
      var title = config.title || '提示';
      var msg = config.msg || '确定要执行当前操作吗';
      var okBtn = config.okBtn || '确定';
      var cancelBtn = config.cancelBtn || '';
      var options = {
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
      if (title == null || title == '') {
        title = false;
      }
      if (url == null || url == '') {
        url = '404.html';
      }
      if (w == null || w == '') {
        w = ($(window).width() * 0.65);
      }
      if (h == null || h == '') {
        h = ($(window).height() - 120);
      }
      layer.open({
        type: 2,
        area: [w + 'px', h + 'px'],
        fix: false, //不固定
        maxmin: true,
        shadeClose: true,
        shade: 0.4,
        title: title,
        content: url,
        success: function (layero, index) {

        },
        error: function (layero, index) {
          alert('aaa');
        }
      });
    }
    //
  }

  window.MyCuckoo = MyCuckoo;
});
