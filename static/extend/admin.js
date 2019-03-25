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

  /*
   * @todo 初始化加载完成执行方法
   * 打开或刷新后执行
   */
  $(function () {
    /*
     * @todo 读取本地存储中记录的已打开的tab项
     */
    setTimeout(function () {
      var menu = menuStorage.getAllMenus();
      if (menu) {
        for (var i = 0; i < menu.length; i++) {
          tab.tabAdd(menu[i].title, menu[i].url, menu[i].id);
        }
      } else {
        return false;
      }

      var curMenu = menuStorage.getCurMenu();
      if (curMenu) {
        $('.layui-tab-title').find('layui-this').removeClass('layui-class');
        var id = curMenu.id;
        if (id) { //因为默认桌面首页不存在lay-id,所以要对此判断
          $('.layui-tab-title li[lay-id="' + id + '"]').addClass('layui-this');
          tab.tabChange(id);
        } else {
          $('.layui-tab-title li').eq(0).addClass('layui-this'); //未生效
          $('.layui-tab-content iframe').eq(0).parent().addClass('layui-show');
        }
      } else {
        $('.layui-tab-title li').eq(0).addClass('layui-this'); //未生效
        $('.layui-tab-content iframe').eq(0).parent().addClass('layui-show');
      }
    }, 100);

    //点击tab标题时，触发tabReload函数
    $('#tabName').on('click', 'li', function () {
      tab.tabReload(this);
    });
    //初始化加载结束
  });

  /*
   * @todo 左侧导航菜单的显示和隐藏
   */
  $('.mycuckoo-container .sidebar-open i').click(function (event) {
    if ($('.mycuckoo-sidebar').css('left') == '0px') {
      //此处左侧菜单是显示状态，点击隐藏
      $('.mycuckoo-sidebar').animate({left: '-221px'}, 100);
      $('.mycuckoo-body').animate({left: '0px'}, 100);
      $('.mycuckoo-body-bg').hide();
    }
    else {
      //此处左侧菜单是隐藏状态，点击显示
      $('.mycuckoo-sidebar').animate({left: '0px'}, 100);
      $('.mycuckoo-body').animate({left: '221px'}, 100);
      //点击显示后，判断屏幕宽度较小时显示遮罩背景
      if ($(window).width() < 768) {
        $('.mycuckoo-body-bg').show();
      }
    }
  });

  /*
   * @todo 点击遮罩背景，左侧菜单隐藏
   */
  $('.mycuckoo-body-bg').click(function (event) {
    $('.left-nav').animate({left: '-221px'}, 100);
    $('.mycuckoo-body').animate({left: '0px'}, 100);
    $(this).hide();
  });

  /*
   * @todo 选项卡右击菜单
   */
  $('.tab-popup-menu li').click(function () {
    var type = $(this).attr('data-type');
    var layId = $(this).attr('data-id')
    if (type == 'close') {
      tab.tabDelete(layId);
    }
    else if (type == 'closeAll') {
      var tabs = $('.layui-tab-title li');
      var ids = new Array();
      $.each(tabs, function (i) {
        ids[i] = $(this).attr('lay-id');
      })
      tab.tabDeleteAll(ids);
    }
    else if (type == 'refresh') {
      tab.tabChange($(this).attr('data-id'));
      var othis = $('.layui-tab-title').find('>li[lay-id="' + layId + '"]'),
        index = othis.parent().children('li').index(othis),
        parents = othis.parents('.layui-tab').eq(0),
        item = parents.children('.layui-tab-content').children('.layui-tab-item'),
        src = item.eq(index).find('iframe').attr('src');
      item.eq(index).find('iframe').attr('src', src);
    }
    else if (type == 'closeOther') {
      var thisId = layId;
      $('.layui-tab-title').find('li').each(function (i, o) {
        var layId = $(o).attr('lay-id');
        if (layId != thisId && layId != 0) {
          tab.tabDelete(layId);
        }
      });
    }
    $('.tab-popup-menu').hide();
  });

  /**
   *@todo tab切换监听
   * tab切换监听不能写字初始化加载$(function())方法内，否则不执行
   */
  element.on('tab(mycuckoo-tab)', function (data) {
    //当前Tab标题所在的原始DOM元素
    menuStorage.setCurMenu();
  });
  /*
   * @todo 监听layui Tab项的关闭按钮，改变本地存储
   */
  element.on('tabDelete(mycuckoo-tab)', function (data) {
    var layId = $(this).parent('li').attr('lay-id');
    menuStorage.removeMenu(layId);
  });

  $(window).resize(function () {
    fixFrameWH();
  });

  /*
   * @todo tab触发事件：增加、删除、切换
   */
  var tab = {
    stopCloseWelcome() {
      $('.layui-tab-title li.welcome').find('i').remove();
    },
    /**
     * 判断是刷新后第一次点击时，刷新frame子页面
     */
    tabReload(which) {
      var layId = $(which).attr('lay-id');
      var i = 1;
      if ($(which).attr('data-bit')) {
        return false;
      } else {
        $(which).attr('data-bit', i);
        var frame = $('.mycuckoo-frame[tab-id=' + layId + ']');
        frame.attr('src', frame.attr('src'));
      }
    },
    tabAdd(title, url, id) {
      //判断当前id的元素是否存在于tab中
      var li = $('.mycuckoo-tab li[lay-id=' + id + ']').length;
      if (li > 0) {
        //tab已经存在，直接切换到指定Tab项
        element.tabChange('mycuckoo-tab', id); //切换到：用户管理
      } else {
        //该id不存在，新增一个Tab项
        element.tabAdd('mycuckoo-tab', {
          id: id,
          title: title,
          content: '<iframe tab-id="' + id + '" frameborder="0" src="' + url + '" scrolling="yes" class="mycuckoo-frame"></iframe>'
        });
        //当前窗口内容
        menuStorage.addMenu(title, url, id);
      }

      showTabPopupMenu(id); //绑定右键菜单
      fixFrameWH(); //计算框架高度
    },
    tabDelete(id) {
      element.tabDelete('mycuckoo-tab', id); //删除
      menuStorage.removeMenu(id);
    },
    tabChange(id) {
      //切换到指定Tab项
      element.tabChange('mycuckoo-tab', id);
    },
    tabDeleteAll(ids) { //删除所有
      $.each(ids, function (i, item) {
        element.tabDelete('mycuckoo-tab', item);
      })

      menuStorage.clearMenus();
    }
  };

  /*
   * @todo 监听右键事件,绑定右键菜单
   * 先取消默认的右键事件，再绑定菜单，触发不同的点击事件
   */
  function showTabPopupMenu(id) {
    //取消右键
    $('.layui-tab-title li').on('contextmenu', function () {
      return false;
    });

    $('.layui-tab-title, .layui-tab-title li').on('click', function () {
      $('.tab-popup-menu').hide();
    });

    //桌面点击右击
    $('.layui-tab-title li').on('contextmenu', function (e) {
      var layId = $(this).attr('lay-id'); //获取右键时li的lay-id属性
      var popupMenu = $('.tab-popup-menu');
      popupMenu.find('li').attr('data-id', layId);

      var left = ($(document).width() - e.clientX) < popupMenu.width() ? (e.clientX - popupMenu.width()) : e.clientX;
      var top = ($(document).height() - e.clientY) < popupMenu.height() ? (e.clientY - popupMenu.height()) : e.clientY;
      popupMenu.css({
        left: left,
        top: top
      }).show();

      return false;
    });
  }

  /*
   * @todo 重新计算iframe高度
   */
  function fixFrameWH() {
    var h = $(window).height() - 164;
    $('iframe').css('height', h + 'px');
  }

  var menuStorage = {
    //存储当前打开窗口
    setCurMenu: function() {
      var curMenu = sessionStorage.getItem('curMenu');
      var id = $('.layui-tab-title').find('.layui-this').attr('lay-id');
      var text = $('.layui-tab-title').find('.layui-this').text().split('ဆ')[0];
      var url = $('.layui-tab-content').find('.layui-show').find('.mycuckoo-frame').attr('src');
      curMenu = {id: id, title: text, url: url}
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
    addMenu: function(title, url, id) {
      var menu = JSON.parse(sessionStorage.getItem('menu'));
      if (menu) {
        var deep = false;
        for (var i = 0; i < menu.length; i++) {
          if (menu[i].id == id) {
            deep = true;
            menu[i].id = id;
            menu[i].title = title;
            menu[i].url = url;
          }
        }
        if (!deep) {
          menu.push({id: id, title: title, url: url})
        }
      } else {
        var menu = [{id: id, title: title, url: url}]
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

  /**
   *@todo Frame内部的按钮点击打开其他frame的tab
   */

  exports('admin', {tab: tab});
});