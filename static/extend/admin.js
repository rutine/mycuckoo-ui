/*
 * @Author: rutine
 * @Code: https://github.com/rutine
 * @Date: 2025-07-05
 * @lastModify 2025-07-05 10:23:35
 */
layui.define(['jquery', 'dropdown', 'tabs'], function (exports) {
  let $ = layui.jquery,
    dropdown = layui.dropdown,
    tabs = layui.tabs;

  let $mycuckoo = $('.mycuckoo-container');
  // 为标签头添加上下文菜单

  let dropdownInst = dropdown.render({
    elem: '.mycuckoo-tab .layui-tabs-header>li',
    trigger: 'contextmenu',
    data: [
      {title: '刷新', action: 'refresh', mode: 'after'},
      {type: '-'},
      {title: '关闭当前', action: 'close', mode: 'this',},
      {title: '关闭其他', action: 'close', mode: 'other'},
      {title: '关闭右侧', action: 'close', mode: 'right'},
      {title: '关闭所有', action: 'close', mode: 'all'}
    ],
    click: function(data, othis, event) {
      let index = this.elem.attr('lay-id');
      if (data.action === 'refresh') {
        tab.reload(this.elem)
      } else if(data.action === 'close') {
        if (data.mode === 'this') {
          tab.close(index);
        } else {
          tab.closeAll(index, data.mode);
        }
      }
    }
  });

  /*
   * @todo 重新计算iframe高度
   */
  function resizeFrame() {
    let h = $(window).height() - 160;
    // $('iframe').css('height', h + 'px');
    $('iframe').css({height: '100%', width: '100%'});
  }

  let Admin = function() {
    /*
     * @todo 读取本地存储中记录的已打开的tab项
     */
    let menu = menuStorage.getAll();
    if (menu) {
      for (let i = 0; i < menu.length; i++) {
        tab.add(menu[i].title, menu[i].url, menu[i].id, menu[i].hideClose);
      }
    }

    let curMenu = menuStorage.get();
    let id = curMenu ? curMenu.id : 'welcome';

    tab.change(id);
  }

  Admin.prototype.render = function() {
    this.renderSidebar();
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

  Admin.prototype.renderTab = function() {
    /**
     *@todo tab切换监听
     * tab切换监听不能写字初始化加载$(function())方法内，否则不执行
     */
    tabs.on('afterChange(mycuckoo-tab)', function (data) {
      menuStorage.set(this);
      tab.reload($(this));

      resizeFrame();
    });
    /*
     * @todo 监听layui Tab项的关闭按钮，改变本地存储
     */
    tabs.on('beforeClose(mycuckoo-tab)', function (data) {
      let layId = $(this).attr('lay-id');
      menuStorage.remove(layId);
    });
  }

  /*
   * @todo tab触发事件：增加、删除、切换
   */
  let tab = {
    /**
     * 判断是刷新后第一次点击时，刷新frame子页面
     */
    reload: function($which) {
      let layId = $which.attr('lay-id');
      let i = 1;
      if ($which.attr('data-bit') && $which.attr('data-bit') > 10000) {
        return false;
      } else if ($which.hasClass('layui-this')) {
        $which.attr('data-bit', i);
        let tabContent = tabs.getBodyItem('mycuckoo-tab', layId);
        let src = tabContent.find('iframe').attr('src');
        tabContent.find('iframe').attr('src', src);
      }
    },
    add: function(title, url, id, hideClose) {
      let old = tabs.getHeaderItem('mycuckoo-tab', id);
      if (old.length > 0) {
        //tab已经存在，直接切换到指定Tab项
        tabs.change('mycuckoo-tab', id);
      } else {
        tabs.add('mycuckoo-tab', {
          id: id,
          title: title,
          closable: !hideClose,
          content: '<iframe class="mycuckoo-frame" tab-id="' + id + '" src="' + url + '"></iframe>',
          done: function (data) {
            //绑定右键菜单
            dropdown.render($.extend({}, dropdownInst.config, {
              elem: data.headerItem
            }));
            resizeFrame(); //计算框架高度
          }
        });

        //当前窗口内容
        menuStorage.add(title, url, id, hideClose);
      }
    },
    close: function(id) {
      tabs.close('mycuckoo-tab', id); //删除
      menuStorage.remove(id);
    },
    change: function(id) {
      tabs.change('mycuckoo-tab', id);
    },
    closeAll: function(id, mode) { //删除所有
      tabs.closeMult('mycuckoo-tab', mode, id);

      menuStorage.clear();
    }
  };

  let menuStorage = {
    //存储当前打开窗口
    set: function(ele) {
      let $ele = $(ele);
      let id = $ele.attr('lay-id');
      let text = $ele.text().split('ဆ')[0];
      let url = tabs.getBodyItem('mycuckoo-tab', id).find('iframe').attr('src');
      let curMenu = {id: id, title: text, url: url}
      sessionStorage.setItem('curMenu', JSON.stringify(curMenu));
    },
    //获取当前打开窗口
    get: function() {
      let curMenu = sessionStorage.getItem('curMenu');
      if (curMenu) {
        curMenu = JSON.parse(curMenu);
      }

      return curMenu;
    },
    /**
     *@todo 本地存储 localStorage
     * 为了保持统一，将sessionStorage更换为存储周期更长的localStorage
     */
    add: function(title, url, id, hideClose) {
      let menu = JSON.parse(sessionStorage.getItem('menu'));
      if (menu) {
        let deep = false;
        for (let i = 0; i < menu.length; i++) {
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
        menu = [{id: id, title: title, url: url, hideClose: hideClose}]
      }
      sessionStorage.setItem('menu', JSON.stringify(menu));
    },
    //移除打开窗口
    remove: function (id) {
      let menu = JSON.parse(sessionStorage.getItem('menu'));
      if (menu) {
        let deep = false;
        for (let i = 0; i < menu.length; i++) {
          if (menu[i].id == id) {
            deep = true;
            menu.splice(i, 1);
          }
        }
        sessionStorage.setItem('menu', JSON.stringify(menu));
      }
    },
    //获取所有打开窗口
    getAll: function () {
      let menu = sessionStorage.getItem('menu');
      if (menu) {
        menu = JSON.parse(menu);
      }

      return menu;
    },
    //清空缓存
    clear: function() {
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