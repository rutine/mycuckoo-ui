/*
 * Name: searchInput
 * Author: rutine@163.com
 * Project: https://github.com/rutine/searchInput
 */
(function (define) {
  define(['jquery'], function ($) {
    "use strict";

    class Class {
      options = {
        elem: '.search-tag-input',
        title: '请选择',
        data: [],
        keyNum: {
          remove: 8, //删除按键编号 默认，BackSpace 键
          create: 13 //创建按键编号 默认，Enter 键
        }
      };

      get elem() {
        return $(this.options.elem);
      }
      get copyData() {
        return [...this.options.data];
      }
      constructor(options) {
        this.render(options);
      }

      render(options) {
        this.init(options);
        this.on();
      }

      init(options) {
        var that = this;
        var select = '';
        this.options = $.extend(this.options, options);
        !this.elem.attr('placeholder') && this.elem.attr('placeholder', '请输入关键词');

        select += '<div class="search-tag-select">';
        select += '<dl class="layui-anim layui-anim-upbit">';
        select += this.options.title ? '<dt>' + this.options.title + '</dt>' : '';
        $.each(this.options.data, function (index, item) {
          select += '<dd lay-value="' + item.field + '">' + item.name + '</dd>';
        });
        select += '</div>';
        select += '</dl>'

        this.elem.after(select);
      }

      on() {
        var that = this;

        this.elem.parent().on('click', function (event) {
          event.preventDefault();
          that.elem.focus();
        });
        this.elem.on('change', function (event) {
          if (that.elem.val().trim()) {
            that.selectTag(true);
          }
        });
        this.elem.parent().on('click', 'span span', function (event) {
          event.preventDefault();
          that.selectTag(false);
        });
        this.elem.parent().on('click', 'dd', function (event) {
          event.preventDefault();
          that.createTag($(this).text());
          that.elem.parent().find('.search-tag-select').removeClass('search-tag-selected');
          that.elem.attr('name', $(this).attr('lay-value')).focus();
        });
        this.elem.keydown(function (event) {
          var keyNum = (event.keyCode ? event.keyCode : event.which);
          var inputValue = that.elem.val().trim();
          if (!inputValue && keyNum === that.options.keyNum.remove) {
            var $tag = that.elem.parent().find('span.search-tag');
            if ($tag.length) {
              event.preventDefault();
              that.removeTag($tag);
            }
          } else if (inputValue && keyNum === that.options.keyNum.create) {
            that.selectTag(true) && event.preventDefault();
            // that.createTag(inputValue);
          }
        });
      }

      selectTag(check) {
        if (check && this.elem.parent().find('span.search-tag').length) {
          return false;
        }
        var $select = this.elem.parent().find('.search-tag-select');
        if ($select.hasClass('search-tag-selected')) {
          return true;
        }

        $select.addClass('search-tag-selected');
        return true;
      }

      createTag(value) {
        if (this.options.beforeCreate && typeof this.options.beforeCreate === 'function') {
          var modifiedValue = this.options.beforeCreate(this.copyData, value);
          if (typeof modifiedValue == 'string' && modifiedValue) {
            value = modifiedValue;
          } else {
            value = '';
          }
        }

        if (value) {
          this.removeTag(this.elem.parent().find('span.search-tag'));
          this.elem.before('<span class="search-tag search-anim-fadein search-bg-gray"><span>' + value + '</span></span>');
          this.onChange(value, 'create');
        }
      }

      removeTag(target) {
        target && target.remove();
      }

      onChange(value, type) {
        this.options.onChange && typeof this.options.onChange === 'function' && this.options.onChange(this.copyData, value, type);
      }

      getData() {
        return this.copyData;
      }

      clearTag() {
        this.elem.prevAll('span.search-tag').remove();
      }
    }

    return {
      render(options) {
        return new Class(options);
      }
    }
  });
}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
  var MOD_NAME = 'searchInput';
  if (typeof module !== 'undefined' && module.exports) { //Node
    module.exports = factory(require('jquery'));
  } else if (window.layui && layui.define) {
    layui.define('jquery', function (exports) { //layui加载
      exports(MOD_NAME, factory(layui.jquery));
    });
  } else {
    window[MOD_NAME] = factory(window.jQuery);
  }
}));