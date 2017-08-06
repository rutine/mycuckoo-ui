MyCuckoo = (function($) {
  
  return {
    modalTemplate : '<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">' + 
        '<div class="modal-dialog">' + 
          '<div class="modal-content">' + 
            '<div class="modal-header">' + 
              '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' + 
              '<h3>提示</h3>' + 
            '</div>' + 
            '<div class="modal-body">' + 
              
            '</div>' + 
            '<div class="modal-footer">' + 
              '<button class="btn btn-primary" data-loading-text="处理中...">保存</button>' + 
              '<button class="btn btn-default" data-dismiss="modal" aria-hidden="true">关闭</button>' + 
            '</div>' + 
          '</div>' + 
        '</div>' + 
      '</div>',
    
    /**
     * 转换查询字符串为json对象, 如: width=1680&height=1050 => {width : "1680", height : "1050"}
     * 
     * @param queryString 查询字符串
     * @return json对象
     */
    fromQueryString : function(queryString) {
      if(!queryString) return {};
      if(queryString.charAt(0) == '?') {
        queryString = queryString.substring(1);
      }
      queryString = decodeURIComponent(queryString);
      
      var obj = {};
      var arr = queryString.split('&');
      for(var i = 0, len = arr.length; i < len; i++) {
        var nameValues = arr[i].split('=');
        obj[nameValues[0]] = nameValues[1];
      }
      
      return obj;
    },
    
    /**
     * 将json对象转换为json字符串, 请参看jQuery.serializeArray()返回的数据格式
     * 
     * @param obj 对象
     * @returns json 字符串
     * @deprecated
     */
    toJSON : function(obj) {
      var json = null;
      if(typeof obj == 'object') { // 对象
        json = '{'; // 开始
        if($.isArray(obj)) { // jQuery.serializeArray() 方法得到的form表单数组对象
          for(var i = 0, len = obj.length; i < len; i++) {
            if(i > 0) json += ',';
            json += '"' + obj[i].name + '":"' + (obj[i].value ? obj[i].value : '') + '"';
          }
        } else {
          var flag = false;
          for(var p in obj) {
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
    apply : function(destObj, srcObj) {
        if(destObj && typeof srcObj == 'object') {
          for(var p in srcObj) {
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
    cloneObject : function(obj) {
      var o = obj.constructor === Array ? [] : {};
      for ( var i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = typeof obj[i] === 'object' ? MyCuckoo.cloneObject(obj[i]) : obj[i];
        }
      }
      
      return o;
    },
    
    /**
     * 复选框绑定<code>click</code>事件
     * 
     * @param 复选框所在的容器元素, 非必须
     */
    checkbox : function(container) {
      var $table = container ? $(container).find('table.table') : $('table.table');
      $table.off('click', 'input[name=all]:checkbox');
      $table.off('click', 'tr:has(input[name=single]:checkbox)');
      $table.on('click', 'input[name=all]:checkbox', function() {
        var $singleCheckboxs = $table.find('input[name=single]:checkbox');
        if(this.checked) {
          $singleCheckboxs.attr('checked', true);
        } else {
          $singleCheckboxs.attr('checked', false);
        }
      });
      $table.on('click', 'tr:has(input[name=single]:checkbox)', function() {
        var $singleCheckbox = $(this).find('input[name=single]:checkbox');
        if($singleCheckbox.attr('checked')) {
          $singleCheckbox.attr('checked', false);
        } else {
          $singleCheckbox.attr('checked', true);
        }
      });
      $table.on('click', 'input[name=single]:checkbox', function(e) {
        e.stopPropagation();
      });
    },

    /**
     * 信息提示框, config对象应提供 'title' 和 'msg' 两个属性
     * 
     * @param config  json对象
     */
    alertMsg: function(config) {
      this.showDialog({title : config.title || '提示', msg : config.msg || '', cancelBtn : '关闭'});
    },
    
    /**
     * 提示信息
     * @param config对象: {state: 'info', title: 'youTitle', msg: 'youMsg', duration: 1000}
     *    state 取值范围 [success, info, warning, danger]
     *    duration 表示信息多久后消失, 单位毫秒
     * 
     * @param config  json对象
     */
    showMsg: function(config) {
      if(typeof config != 'object') {
        config = {state: 'info', title: '提示', msg: '正在处理中, 请稍等...', duration: 2000};
      }
      
      var $oldAlert = $('.alert.navbar-fixed-top');
      var top = ($oldAlert.offset() ? $oldAlert.offset().top : 0) + ($oldAlert.outerHeight() + 1);
      
      var $alert =  $('<div class="alert alert-' + (config.state || 'info') + 
                  ' navbar-fixed-top center-block" style="display:none; max-width:320px;z-index:1051;">' + 
                '<button type="button" class="close" data-dismiss="alert">×</button>' + 
                '<strong>' + (config.title || '提示') + '</strong> ' + (config.msg || '正在处理中...') + 
              '</div>');
      $alert.prependTo($(window.top.document.body));
      $alert.animate({top : top, opacity : 'show'}, 300);
      setTimeout(function() { $alert.alert('close'); }, (config.duration || 2000));
    },
    
    /**
     * 弹出dialog
     * 
     * @param config  json对象
     * {title : '提示', msg: '确定要执行当前操作吗?', okBtn: '确定', cancelBtn: '取消', ok: function() {}, cancel: function() {}}
     */
    showDialog : function(config) {
      if(typeof config != 'object') {
        config = {title : '提示', msg: '确定要执行当前操作吗?', okBtn: '确定', cancelBtn: '取消', ok: function() {}, cancel: function() {}};
      }
      var title = config.title || "提示";
      var msg = config.msg || "确定要执行当前操作吗";
      var okBtn = config.okBtn || "";
      var cancelBtn = config.cancelBtn || "";
      var hasBtn = (okBtn != "" || cancelBtn != "");
      var dialog = '<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">' + 
        '<div class="modal-dialog modal-sm">' + 
          '<div class="modal-content">' + 
            '<div class="modal-header">' + 
              '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' + 
              '<h4>' + title + '</h4>' + 
            '</div>' + 
            '<div class="modal-body">' + msg + '</div>' + 
            '<div class="modal-footer">' + 
              (okBtn != '' ? '<button class="btn btn-primary" data-loading-text="处理中...">' + okBtn + '</button>' : '') + 
              (cancelBtn != '' ? '<button class="btn btn-default" data-dismiss="modal" aria-hidden="true">' + cancelBtn + '</button>' : '') + 
              (!hasBtn ? '<button class="btn btn-primary" data-dismiss="modal" aria-hidden="true">确定</button>' : '') + 
            '</div>' + 
          '</div>' + 
        '</div>' + 
      '</div>';
      var $dialog = $(dialog);
      $dialog.one('show.bs.modal', function() {
        if(okBtn) {
          $(this).off('click', '.modal-footer > .btn:first');
          $(this).on('click', '.modal-footer > .btn:first', function() {
            $dialog.modal('hide');
            try { 
              config.ok();
            } catch(e) {
              // do something...
            }
          });
        }
      });
      $dialog.one('hidden.bs.modal', function() {
        $(this).off().find('.btn').off().end().remove();
      });
      $dialog.modal();
    }
    //
  };
})(jQuery);