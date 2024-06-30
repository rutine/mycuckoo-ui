/*
 * @Author: https://github.com/WangEn
 * @Author: https://gitee.com/lovetime/
 * @Date:   2018-01-01
 * @lastModify 2018-3-27 15:00:35
 * +----------------------------------------------------------------------
 * | Weadmin [ 后台管理模板 ]
 * | 基于Layui http://www.layui.com/
 * +----------------------------------------------------------------------
 */

layui.define(['jquery', 'layer', 'element'], function (exports) {
  var $ = layui.jquery,
    layer = layui.layer,
    element = layui.element;

  var $mycuckoo = $('.mycuckoo-container');
  var $tabContainer = $mycuckoo.find('.mycuckoo-tab');
  var $tabPopupMenu = $('.tab-popup-menu');

  /*
   * @todo 监听右键事件,绑定右键菜单
   * 先取消默认的右键事件，再绑定菜单，触发不同的点击事件
   */
  function showTabPopupMenu(id) {
    //取消右键
    $tabContainer.find('.layui-tab-title').children().on('contextmenu', function () {
      return false;
    });

    $tabContainer.find('.layui-tab-title, .layui-tab-title li').on('click', function () {
      $tabPopupMenu.hide();
    });

    //桌面点击右击
    $tabContainer.find('.layui-tab-title').children().on('contextmenu', function (e) {
      var layId = $(this).attr('lay-id'); //获取右键时li的lay-id属性
      $tabPopupMenu.find('li').attr('data-id', layId);

      var left = ($(document).width() - e.clientX) < $tabPopupMenu.width() ? (e.clientX - $tabPopupMenu.width()) : e.clientX;
      var top = ($(document).height() - e.clientY) < $tabPopupMenu.height() ? (e.clientY - $tabPopupMenu.height()) : e.clientY;
      $tabPopupMenu.css({
        left: left,
        top: top
      }).show();

      return false;
    });
  }

  /*
   * @todo 重新计算iframe高度
   */
  function resizeFrame() {
    // var h = $(window).height() - 100;
    // $('iframe').css('height', h + 'px');
    $('iframe').css('height', '100%');
  }

  var Admin = function() {
    /*
     * @todo 读取本地存储中记录的已打开的tab项
     */
    var menu = menuStorage.getAllMenus();
    if (menu) {
      for (var i = 0; i < menu.length; i++) {
        tab.tabAdd(menu[i].title, menu[i].url, menu[i].id, menu[i].hideClose);
      }
    } else {
      return false;
    }

    var curMenu = menuStorage.getCurMenu();
    if (curMenu) {
      $tabContainer.find('.layui-this').removeClass('layui-this');
      var id = curMenu.id;
      if (id) { //因为默认桌面首页不存在lay-id,所以要对此判断
        tab.tabChange(id);
      } else {
        $tabContainer.find('.layui-tab-title').children().eq(0).addClass('layui-this'); //未生效
        $tabContainer.find('.layui-tab-content').children().eq(0).addClass('layui-show');
      }
    } else {
      $tabContainer.find('.layui-tab-title').children().eq(0).addClass('layui-this'); //未生效
      $tabContainer.find('.layui-tab-content').children().eq(0).addClass('layui-show');
    }

    //点击tab标题时，触发tabReload函数
    $tabContainer.find('.layui-tab-title').on('click', 'li', function() {
      tab.tabReload(this);
    });
  }

  Admin.prototype.render = function() {
    this.renderSidebar();
    this.renderPopupMenu();
    this.renderTab();
  }

  Admin.prototype.renderSidebar = function() {
    /*
     * @todo 左侧导航菜单的显示和隐藏
     */
    $mycuckoo.find('.sidebar-open').children().click(function (event) {
      if ($mycuckoo.find('.mycuckoo-sidebar').css('left') == '0px') {
        //此处左侧菜单是显示状态，点击隐藏
        $mycuckoo.find('.mycuckoo-sidebar').animate({left: '-221px'}, 100);
        $mycuckoo.find('.mycuckoo-body').animate({left: '0px'}, 100);
        $mycuckoo.find('.mycuckoo-body-bg').hide();
      }
      else {
        //此处左侧菜单是隐藏状态，点击显示
        $mycuckoo.find('.mycuckoo-sidebar').animate({left: '0px'}, 100);
        $mycuckoo.find('.mycuckoo-body').animate({left: '221px'}, 100);
        //点击显示后，判断屏幕宽度较小时显示遮罩背景
        if ($(window).width() < 768) {
          $mycuckoo.find('.mycuckoo-body-bg').show();
        }
      }
    });

    /*
     * @todo 点击遮罩背景，左侧菜单隐藏
     */
    $mycuckoo.find('.mycuckoo-body-bg').click(function (event) {
      $mycuckoo.find('.mycuckoo-sidebar').animate({left: '-221px'}, 100);
      $mycuckoo.find('.mycuckoo-body').animate({left: '0px'}, 100);
      $(this).hide();
    });
  }

  Admin.prototype.renderPopupMenu = function() {
    /*
   * @todo 选项卡右击菜单
   */
    $tabPopupMenu.children().click(function () {
      var $this = $(this);
      var type = $this.attr('data-type');
      var layId = $this.attr('data-id')

      if (type == 'refresh') {
        tab.tabChange(layId);
        var src = $tabContainer.find('.layui-show').children().attr('src');
        $tabContainer.find('.layui-show').children().attr('src', src);
      }
      else if (type == 'close') {
        tab.tabDelete(layId);
      }
      else if (type == 'closeOther') {
        var thisId = layId;
        $tabContainer.find('.layui-tab-title').children().each(function (i, o) {
          var layId = $(o).attr('lay-id');
          if (layId != thisId && layId != 0) {
            tab.tabDelete(layId);
          }
        });
      }
      else if (type == 'closeAll') {
        var $li = $tabContainer.find('.layui-tab-title').children();
        var ids = new Array();
        $.each($li, function (i, el) {
          ids[i] = el.getAttribute('lay-id');
        })
        tab.tabDeleteAll(ids);
      }
      $tabPopupMenu.hide();
    });
  }

  Admin.prototype.renderTab = function() {
    /**
     *@todo tab切换监听
     * tab切换监听不能写字初始化加载$(function())方法内，否则不执行
     */
    element.on('tab(mycuckoo-tab)', function (data) {
      //当前Tab标题所在的原始DOM元素
      menuStorage.setCurMenu(data.elem);
    });
    /*
     * @todo 监听layui Tab项的关闭按钮，改变本地存储
     */
    element.on('tabDelete(mycuckoo-tab)', function (data) {
      var layId = $(this).parent('li').attr('lay-id');
      menuStorage.removeMenu(layId);
    });
  }

  /*
   * @todo tab触发事件：增加、删除、切换
   */
  var tab = {
    /**
     * 判断是刷新后第一次点击时，刷新frame子页面
     */
    tabReload: function(which) {
      var layId = $(which).attr('lay-id');
      var i = 1;
      if ($(which).attr('data-bit')) {
        return false;
      } else {
        $(which).attr('data-bit', i);
        var src = $tabContainer.find('.layui-show').children().attr('src');
        $tabContainer.find('.layui-show').children().attr('src', src);
      }
    },
    tabAdd: function(title, url, id, hideClose) {
      //判断当前id的元素是否存在于tab中
      var li = $tabContainer.find('.mycuckoo-tab li[lay-id=' + id + ']').length;
      if (li > 0) {
        //tab已经存在，直接切换到指定Tab项
        element.tabChange('mycuckoo-tab', id);
      } else {
        //该id不存在，新增一个Tab项
        element.tabAdd('mycuckoo-tab', {
          id: id,
          title: title,
          allowClose: !hideClose,
          content: '<iframe class="mycuckoo-frame" tab-id="' + id + '" frameborder="0" src="' + url + '" scrolling="no"></iframe>'
        });
        //当前窗口内容
        menuStorage.addMenu(title, url, id, hideClose);
      }

      showTabPopupMenu(id); //绑定右键菜单
      resizeFrame(); //计算框架高度
    },
    tabDelete: function(id) {
      element.tabDelete('mycuckoo-tab', id); //删除
      menuStorage.removeMenu(id);
    },
    tabChange: function(id) {
      //切换到指定Tab项
      element.tabChange('mycuckoo-tab', id);
    },
    tabDeleteAll: function(ids) { //删除所有
      $.each(ids, function (i, item) {
        element.tabDelete('mycuckoo-tab', item);
      })

      menuStorage.clearMenus();
    }
  };

  var menuStorage = {
    //存储当前打开窗口
    setCurMenu: function(ele) {
      var $ele = $(ele);
      var id = $ele.find('.layui-this').attr('lay-id');
      var text = $ele.find('.layui-this').text().split('ဆ')[0];
      var url = $ele.find('.layui-show .mycuckoo-frame').attr('src');
      var curMenu = {id: id, title: text, url: url}
      sessionStorage.setItem('curMenu', JSON.stringify(curMenu));
    },
    //获取当前打开窗口
    getCurMenu: function() {
      var curMenu = sessionStorage.getItem('curMenu');
      if (curMenu) {
        curMenu = JSON.parse(curMenu);
      }

      return curMenu;
    },
    /**
     *@todo 本地存储 localStorage
     * 为了保持统一，将sessionStorage更换为存储周期更长的localStorage
     */
    addMenu: function(title, url, id, hideClose) {
      var menu = JSON.parse(sessionStorage.getItem('menu'));
      if (menu) {
        var deep = false;
        for (var i = 0; i < menu.length; i++) {
          if (menu[i].id == id) {
            deep = true;
            menu[i].id = id;
            menu[i].title = title;
            menu[i].url = url;
            menu[i].hideClose = hideClose;
          }
        }
        if (!deep) {
          menu.push({id: id, title: title, url: url, hideClose: hideClose})
        }
      } else {
        var menu = [{id: id, title: title, url: url, hideClose: hideClose}]
      }
      sessionStorage.setItem('menu', JSON.stringify(menu));
    },
    //移除打开窗口
    removeMenu: function (id) {
      var menu = JSON.parse(sessionStorage.getItem('menu'));
      if (menu) {
        var deep = false;
        for (var i = 0; i < menu.length; i++) {
          if (menu[i].id == id) {
            deep = true;
            menu.splice(i, 1);
          }
        }
        sessionStorage.setItem('menu', JSON.stringify(menu));
      }
    },
    //获取所有打开窗口
    getAllMenus: function () {
      var menu = sessionStorage.getItem('menu');
      if (menu) {
        menu = JSON.parse(menu);
      }

      return menu;
    },
    //清空缓存
    clearMenus: function() {
      sessionStorage.removeItem('menu');
    }
  }

  $(window).resize(function () {
    resizeFrame();
  });


  /**
   *@todo Frame内部的按钮点击打开其他frame的tab
   */

  exports('admin', {admin: Admin, tab: tab});
});