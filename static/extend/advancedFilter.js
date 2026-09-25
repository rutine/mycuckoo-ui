/** 根据表头配置生成高级筛选弹窗。 */
layui.define(['jquery', 'layer', 'table', 'form', 'laydate', 'dropdown'], function(exports) {
  const $ = layui.jquery,
      layer = layui.layer,
      table = layui.table,
      form = layui.form,
      laydate = layui.laydate,
      dropdown = layui.dropdown;

  const filterValues = Object.create(null);
  const dialogIndexes = Object.create(null);
  let dialogSequence = 0;
  const filterTypeNames = {
    eq: '等于',
    like: '前缀匹配',
    text: '模糊匹配',
    scope: '区间',
    multi: '多选',
    province_city: '省 / 市',
    province_city_area: '省 / 市 / 区',
    bool: '是否'
  };

  const DATE_FORMAT = 'yyyy-MM-dd';
  const DIALOG_MAX_HEIGHT = 640;
  const MULTI_MAX_HEIGHT = 180;
  const FIELD_DROPDOWN_MAX_HEIGHT = 260;

  function getFilterColumns(columns) {
    return (columns || []).flat().filter(function(column) {
      return column.field && (column.filter === true || column.filter === 1);
    });
  }

  function toText(value) {
    return value == null ? '' : String(value).trim();
  }

  function isRegionFilter(filterType) {
    return filterType.indexOf('province_city') === 0;
  }

  function isDateColumn(column) {
    return (column.dataType || column.type) === 'date';
  }

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return NaN;
    }
    const timestamp = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(timestamp)) {
      return NaN;
    }
    const formatted = new Date(timestamp).toISOString().slice(0, 10);
    return formatted === value ? timestamp : NaN;
  }

  function serializeRange(column, value) {
    const title = column.title || column.field;
    const isDate = isDateColumn(column);
    const range = Array.isArray(value) ? value : [];
    const startText = toText(range[0]);
    const endText = toText(range[1]);
    const parseValue = isDate ? parseDate : Number;
    const start = startText === '' ? null : parseValue(startText);
    const end = endText === '' ? null : parseValue(endText);

    const invalidStart = start !== null && !Number.isFinite(start);
    const invalidEnd = end !== null && !Number.isFinite(end);
    if (invalidStart || invalidEnd) {
      const valueType = isDate ? '日期' : '数字';
      throw new Error(title + '：请输入有效的' + valueType);
    }
    if (start !== null && end !== null && start > end) {
      throw new Error(title + '：起始值不能大于结束值');
    }
    if (startText === '' && endText === '') {
      return '';
    }
    return [startText, endText];
  }

  function serializeValue(column, value) {
    const filterType = column.filterType || 'eq';
    if (!Object.prototype.hasOwnProperty.call(filterTypeNames, filterType)) {
      throw new Error('不支持的筛选类型：' + filterType);
    }
    if (filterType === 'scope') {
      return serializeRange(column, value);
    }
    if (filterType === 'multi') {
      const selected = Array.isArray(value) ? value.map(toText).filter(Boolean) : [];
      return selected.length ? Array.from(new Set(selected)) : '';
    }
    if (isRegionFilter(filterType)) {
      const selected = Array.isArray(value) ? value : [];
      const levelCount = filterType === 'province_city' ? 2 : 3;
      const regionPath = [];
      for (let level = 0; level < levelCount; level++) {
        const code = toText(selected[level]);
        if (!code) {
          break;
        }
        regionPath.push(code);
      }
      return regionPath.length ? regionPath : '';
    }

    const textValue = toText(value);
    if (filterType === 'bool' && textValue && textValue !== 'true' && textValue !== 'false') {
      throw new Error((column.title || column.field) + '：请选择是或否');
    }
    if (isDateColumn(column) && textValue && !/^\d{4}-\d{2}-\d{2}$/.test(textValue)) {
      throw new Error((column.title || column.field) + '：请输入有效的日期');
    }
    return textValue;
  }

  function serialize(columns, values) {
    values = values || {};
    const entries = getFilterColumns(columns).map(function(column) {
      return [column.field, serializeValue(column, values[column.field])];
    });
    return Object.fromEntries(entries);
  }

  function getResponseItems(response) {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.code != null && response.code !== 0 && response.code !== 200) {
      throw new Error(response.msg || '数据加载失败');
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error('筛选选项数据格式不正确');
  }

  function normalizeOptions(items) {
    return items.map(function(item) {
      let value = item.key;
      if (value == null) {
        value = item.code;
      }
      if (value == null) {
        value = item.id;
      }
      let label = item.value;
      if (label == null) {
        label = item.name;
      }
      if (label == null) {
        label = item.text;
      }
      return {
        value: toText(value),
        label: toText(label == null ? value : label),
        children: normalizeOptions(item.children || [])
      };
    });
  }

  async function loadColumnOptions(column, options) {
    if (column.data != null) {
      return column.data;
    }
    const isRegion = isRegionFilter(column.filterType);
    if (isRegion && options.regions != null) {
      if (typeof options.regions === 'function') {
        return options.regions(column);
      }
      return options.regions;
    }
    if (options.loadOptions) {
      return options.loadOptions(column);
    }
    if (column.url) {
      return $.getJSON(column.url);
    }

    const app = window.MyCuckoo;
    if (isRegion && app) {
      const action = app.getResourceMap()[app.res.districtMgr.tree];
      if (!action.canAccess()) {
        throw new Error('无权访问地区资源');
      }
      return $.request(action, {id: 0});
    }

    let dictCode = column.dictCode;
    if (!dictCode && (column.dataType || column.type) === 'dict') {
      dictCode = column.extra;
    }
    if (dictCode && app) {
      const response = await app.api.getDict({typeCodes: dictCode});
      if (!response || !response.data || !Array.isArray(response.data[dictCode])) {
        throw new Error('字典加载失败');
      }
      return response.data[dictCode];
    }

    const sourceName = isRegion ? '地区' : '字典';
    throw new Error('请配置' + sourceName + '数据源');
  }

  function createInput($container, inputType, label) {
    const $input = $('<input class="layui-input">');
    $input.attr({type: inputType, 'aria-label': label, step: 'any'});
    return $input.appendTo($container);
  }

  function createDateInput($container, label, placeholder) {
    const $input = $('<input type="text" class="layui-input" readonly>');
    $input.attr({'aria-label': label, placeholder: placeholder || ''});
    $input.appendTo($container);
    laydate.render({
      elem: $input[0],
      type: 'date',
      format: DATE_FORMAT,
      trigger: 'click'
    });
    return $input;
  }

  function createSelect($container, label) {
    const $select = $('<select lay-filter="advanced-filter-select" lay-search></select>');
    $select.attr('aria-label', label);
    return $select.appendTo($container);
  }

  function fillSelect($select, items, placeholder = '不限') {
    $select.empty();
    $select.append($('<option></option>').val('').text(placeholder));
    items.forEach(function(item) {
      $select.append($('<option></option>').val(item.value).text(item.label));
    });
  }

  function renderInput($container, column) {
    const isDate = isDateColumn(column);
    if (isDate) {
      const $input = createDateInput($container, column.title, filterTypeNames[column.filterType] + '，留空不限');
      return {
        getValue: function() { return $input.val(); },
        setValue: function(value) { $input.val(toText(value)); }
      };
    }

    const dataType = column.dataType || column.type;
    let inputType = 'text';
    if (dataType === 'number') {
      inputType = 'number';
    }
    const $input = createInput($container, inputType, column.title);
    $input.attr('placeholder', filterTypeNames[column.filterType] + '，留空不限');
    return {
      getValue: function() {
        if ($input[0].validity.badInput) {
          throw new Error(column.title + '：请输入有效值');
        }
        return $input.val();
      },
      setValue: function(value) {
        $input.val(toText(value));
      }
    };
  }

  function renderRange($container, column) {
    const isDate = isDateColumn(column);
    const $row = $('<div class="layui-row layui-col-space10"></div>').appendTo($container);
    const $startColumn = $('<div class="layui-col-xs12 layui-col-sm6"></div>').appendTo($row);
    const $endColumn = $('<div class="layui-col-xs12 layui-col-sm6"></div>').appendTo($row);

    let $start, $end;
    if (isDate) {
      $start = createDateInput($startColumn, column.title + '起始值', '起始日期');
      $end = createDateInput($endColumn, column.title + '结束值', '结束日期');
    } else {
      $start = createInput($startColumn, 'number', column.title + '起始值');
      $end = createInput($endColumn, 'number', column.title + '结束值');
      $start.attr({placeholder: '起始值', title: '起始值'});
      $end.attr({placeholder: '结束值', title: '结束值'});
    }

    return {
      getValue: function() {
        if (!isDate && ($start[0].validity.badInput || $end[0].validity.badInput)) {
          throw new Error(column.title + '：请输入有效的区间值');
        }
        return [$start.val(), $end.val()];
      },
      setValue: function(value) {
        $start.val(toText(value && value[0]));
        $end.val(toText(value && value[1]));
      }
    };
  }

  function renderSelect($container, column, items) {
    const $select = createSelect($container, column.title);
    fillSelect($select, items);
    return {
      getValue: function() { return $select.val(); },
      setValue: function(value) {
        $select.val(toText(value));
        form.render('select', $container.closest('form').attr('lay-filter'));
      }
    };
  }

  function renderMultiSelect($container, items) {
    const labelByValue = Object.create(null);
    items.forEach(function(item) {
      labelByValue[item.value] = item.label;
    });

    const $trigger = $([
      '<div class="layui-input advanced-filter-multi-trigger" role="combobox"',
      ' aria-haspopup="listbox" aria-expanded="false" tabindex="0">',
      '<span class="advanced-filter-multi-value advanced-filter-multi-placeholder">请选择</span>',
      '<i class="layui-icon layui-icon-down" aria-hidden="true"></i>',
      '</div>'
    ].join('')).appendTo($container);
    const $panel = $('<div class="advanced-filter-multi-panel" role="listbox" aria-multiselectable="true"></div>');
    const $search = $('<input type="text" class="layui-input advanced-filter-multi-search" placeholder="搜索选项">').appendTo($panel);
    const $list = $('<div class="advanced-filter-multi-list"></div>').appendTo($panel);
    let selectedValues = [];

    function getValue() {
      return selectedValues.slice();
    }

    function updateTrigger() {
      const labels = selectedValues.map(function(value) {
        return labelByValue[value] || value;
      });
      const text = labels.length ? labels.join('，') : '请选择';
      $trigger.find('.advanced-filter-multi-value')
          .toggleClass('advanced-filter-multi-placeholder', !labels.length)
          .text(text);
      $trigger.attr('title', labels.length ? text : '');
    }

    function renderItems(keyword) {
      const kw = (keyword || '').trim().toLowerCase();
      const selectedMap = Object.create(null);
      selectedValues.forEach(function(value) {
        selectedMap[value] = true;
      });
      $list.empty();

      let matched = 0;
      items.forEach(function(item) {
        if (kw && item.label.toLowerCase().indexOf(kw) === -1) {
          return;
        }
        matched++;
        const $option = $('<label class="advanced-filter-multi-option"></label>');
        $('<input type="checkbox">')
            .val(item.value)
            .prop('checked', !!selectedMap[item.value])
            .appendTo($option);
        $('<span></span>').text(item.label).appendTo($option);
        $option.appendTo($list);
      });

      if (!matched) {
        $list.append($('<div class="advanced-filter-multi-empty"></div>').text('无匹配选项'));
      }
      updateTrigger();
    }

    function setValue(value) {
      selectedValues = Array.isArray(value) ? value.map(toText).filter(Boolean) : [];
      renderItems($search.val());
    }

    $panel.on('change', 'input[type=checkbox]', function() {
      const value = this.value;
      if (this.checked) {
        if (selectedValues.indexOf(value) === -1) {
          selectedValues.push(value);
        }
      } else {
        selectedValues = selectedValues.filter(function(item) {
          return item !== value;
        });
      }
      updateTrigger();
    });

    let timer = null;
    $search.on('input', function() {
      const keyword = $(this).val();
      clearTimeout(timer);
      timer = setTimeout(function() {
        renderItems(keyword);
      }, 120);
    });

    renderItems('');
    const dropdownInstance = dropdown.render({
      elem: $trigger[0],
      content: $panel,
      trigger: 'click',
      closeOnClick: true,
      onClickOutside: function() {
        $trigger.attr('aria-expanded', 'false');
      },
      className: 'advanced-filter-multi-dropdown',
      style: 'width:' + Math.max(190, $container.innerWidth()) + 'px;'
    });
    $trigger.on('click', function() {
      const isOpen = $('.layui-dropdown[lay-dropdown-id="' + dropdownInstance.config.id + '"]').length > 0;
      $(this).attr('aria-expanded', isOpen ? 'true' : 'false');
    });
    $container.closest('.advanced-filter-fields').on('scroll', function() {
      $trigger.attr('aria-expanded', 'false');
      dropdown.close(dropdownInstance.config.id);
    });

    return {getValue: getValue, setValue: setValue};
  }

  function renderRegion($container, column, items) {
    const placeholders = ['不限省', '不限市', '不限区 / 县'];
    const levelCount = column.filterType === 'province_city' ? 2 : 3;
    const selects = [];
    const $row = $('<div class="layui-row layui-col-space10"></div>').appendTo($container);
    const columnClass = levelCount === 2 ? 'layui-col-sm6' : 'layui-col-sm4';
    for (let level = 0; level < levelCount; level++) {
      const $column = $('<div class="layui-col-xs12"></div>').addClass(columnClass).appendTo($row);
      selects.push(createSelect($column, column.title + placeholders[level]));
    }

    function getValue() {
      return selects.map(function($select) { return $select.val() || ''; });
    }

    function setValue(regionPath) {
      let currentItems = items;
      selects.forEach(function($select, level) {
        fillSelect($select, currentItems, placeholders[level]);
        $select.prop('disabled', level > 0 && !selects[level - 1].val());
        $select.val(toText(regionPath && regionPath[level]));
        const selected = currentItems.find(function(item) { return item.value === $select.val(); });
        if (!selected) {
          $select.val('');
        }
        currentItems = selected ? selected.children : [];
      });
      form.render('select', $container.closest('form').attr('lay-filter'));
    }

    selects.forEach(function($select, level) {
      $select.on('change', function() {
        const regionPath = getValue().slice(0, level + 1);
        setValue(regionPath);
      });
    });
    return {getValue: getValue, setValue: setValue};
  }

  function AdvancedFilter(options) {
    const tableId = options.id;
    if (!tableId) {
      throw new Error('高级筛选需要指定表格 id');
    }

    const tableConfig = table.getOptions(tableId) || {};
    this.options = options;
    this.tableId = tableId;
    this.formFilter = 'advanced-filter-' + (++dialogSequence);
    this.allColumns = getFilterColumns(options.cols || tableConfig.cols).map(function(column) {
      return Object.assign({}, column, {filterType: column.filterType || 'eq'});
    });
    this.values = Object.assign({}, options.values || filterValues[tableId] || tableConfig.where || {});
    this.columns = this.getInitialColumns(options.fields);
    this.controls = [];
    this.closed = false;
    this.submitting = false;
    this.$layero = null;

    serialize(this.allColumns, {});
    if (dialogIndexes[tableId]) {
      layer.close(dialogIndexes[tableId]);
    }
  }

  AdvancedFilter.prototype = {
    constructor: AdvancedFilter,

    getInitialColumns: function(fields) {
      const selectedFields = Array.isArray(fields) ? fields : Object.keys(this.values || {});
      return this.allColumns.filter(function(column) {
        return selectedFields.indexOf(column.field) !== -1;
      });
    },

    calcDialogHeight: function() {
      const viewportMax = window.innerHeight - 48;
      return Math.min(viewportMax, DIALOG_MAX_HEIGHT);
    },

    render: function() {
      const that = this;
      this.$form = $([
        '<form class="advanced-filter layui-form advanced-filter-form" novalidate>',
        '<div class="advanced-filter-head">',
        '<blockquote class="layui-elem-quote layui-font-12" style="margin:0 0 10px 0;">同时满足以下条件；留空表示不限。</blockquote>',
        '<div class="advanced-filter-picker layui-form-item" style="margin-bottom:10px;">',
        '<label class="layui-form-label">添加字段</label>',
        '<div class="layui-input-inline advanced-filter-picker-inline">',
        '<select lay-filter="advanced-filter-field" lay-search=""><option value="">请选择筛选字段</option></select>',
        '</div>',
        '<button type="button" class="layui-btn layui-btn-primary" data-event="add">添加</button>',
        '</div>',
        '</div>',
        '<div class="advanced-filter-fields"></div>',
        '<div class="advanced-filter-error layui-form-item layui-font-red layui-hide" role="alert"></div>',

        '</form>'
      ].join(''));
      this.$form.attr('lay-filter', this.formFilter);
      this.$fields = this.$form.find('.advanced-filter-fields');
      this.$error = this.$form.find('.advanced-filter-error');

      this.$fieldSelect = this.$form.find('select[lay-filter=advanced-filter-field]');
      this.$add = this.$form.find('[data-event=add]');
      this.$reset = $();
      this.$submit = $();

      this.columns.forEach(function(column) {
        that.renderField(column);
      });
      if (!this.columns.length) {
        this.$fields.append($('<hr class="advanced-filter-empty-line">'));
      }

      this.$form.hide().appendTo('body');
      form.render(null, this.formFilter);
      this.refreshFieldPicker();

      const width = Math.min(480, window.innerWidth - 24);
      const height = this.calcDialogHeight();

      this.layerIndex = layer.open({
        type: 1,
        title: this.options.title || '高级筛选',
        content: this.$form,
        area: [width + 'px', height + 'px'],
        btn: ['重置', '取消', '查询'],
        btnAlign: 'c',
        btn1: function() {
          if (!that.submitting) {
            that.reset();
          }
          return false;
        },
        btn3: function() {
          that.submit();
          return false;
        },
        shadeClose: false,
        resize: false,
        beforeEnd: function() {
          that.closed = true;
        },
        success: function(layero) {
          that.$layero = layero;
          that.$reset = layero.find('.layui-layer-btn0');
          that.$submit = layero.find('.layui-layer-btn2');
          layero.addClass('advanced-filter-dialog');
          that.updateStatus();
        },
        end: function() {
          that.closed = true;
          that.$layero = null;
          if (dialogIndexes[that.tableId] === that.layerIndex) {
            delete dialogIndexes[that.tableId];
          }
          that.$form.remove();
        }
      });
      dialogIndexes[this.tableId] = this.layerIndex;
      this.bindEvents();
      this.updateStatus();
      return this.layerIndex;
    },

    resizeDialog: function() {
      // 由 Layer 自动计算标题、按钮和内容区高度
    },

    renderField: function(column) {
      const $row = $([
        '<div class="advanced-filter-row layui-form-item">',
        '<div class="layui-inline">',
        '<label class="layui-form-label"></label>',
        '<div class="advanced-filter-control layui-input-inline"></div>',
        '<div class="advanced-filter-btn layui-form-mid layui-text-em"></div>',
        '</div>',
        '</div>'
      ].join(''));
      $row.attr('data-field', column.field).appendTo(this.$fields);
      $row.find('.layui-form-label').text(column.title || column.field).attr('title', filterTypeNames[column.filterType]);

      const control = {
        column: column,
        value: this.values[column.field],
        $container: $row.find('.advanced-filter-control'),
        input: null,
        loading: false,
        failed: false
      };
      control.$row = $row;
      control.$remove = $('<i class="layui-icon layui-icon-delete"></i>');
      control.$remove.on('click', this.removeField.bind(this, column.field));

      $row.find('.advanced-filter-btn').append(control.$remove);
      this.controls.push(control);

      const filterType = column.filterType;
      const dataType = column.dataType || column.type;
      const hasOptions = dataType === 'dict' || column.data || column.url || column.dictCode;
      const needsOptions = filterType === 'multi' || isRegionFilter(filterType) || (filterType === 'eq' && hasOptions);
      if (needsOptions) {
        control.$status = $('<div class="advanced-filter-status layui-text-em" role="status"></div>').appendTo(control.$container);
        control.$choices = $('<div class="advanced-filter-choices"></div>').appendTo(control.$container);
        this.loadOptions(control);
        return;
      }

      switch (filterType) {
        case 'scope':
          control.input = renderRange(control.$container, column);
          break;
        case 'bool':
          control.input = renderSelect(control.$container, column, [
            {value: 'true', label: '是'},
            {value: 'false', label: '否'}
          ]);
          break;
        default:
          control.input = renderInput(control.$container, column);
      }
      control.input.setValue(control.value);
    },

    addField: function(field) {
      const column = this.allColumns.find(function(item) {
        return item.field === field;
      });
      if (!column || this.columns.some(function(item) { return item.field === field; })) {
        return;
      }
      this.columns.push(column);
      this.renderField(column);
      this.refreshFieldPicker();
      this.updateStatus();
    },

    removeField: function(field) {
      const controlIndex = this.controls.findIndex(function(control) {
        return control.column.field === field;
      });
      if (controlIndex !== -1) {
        this.controls[controlIndex].$row.remove();
        this.controls.splice(controlIndex, 1);
      }
      this.columns = this.columns.filter(function(column) {
        return column.field !== field;
      });
      this.refreshFieldPicker();
      this.updateStatus();
    },

    refreshFieldPicker: function() {
      const selected = this.columns.map(function(column) { return column.field; });
      this.$fieldSelect.empty().append($('<option></option>').val('').text('请选择筛选字段'));
      this.allColumns.forEach(function(column) {
        if (selected.indexOf(column.field) === -1) {
          this.$fieldSelect.append($('<option></option>').val(column.field).text(column.title || column.field));
        }
      }, this);
      this.$add.prop('disabled', this.$fieldSelect.find('option').length <= 1);
      form.render('select', this.formFilter);
    },

    loadOptions: async function(control) {
      const that = this;
      control.loading = true;
      control.failed = false;
      control.$status.removeClass('layui-hide').text('正在加载…');
      this.updateStatus();

      try {
        const response = await loadColumnOptions(control.column, this.options);
        if (this.closed) {
          return;
        }

        const items = normalizeOptions(getResponseItems(response));
        control.$choices.empty();
        switch (control.column.filterType) {
          case 'multi':
            control.input = renderMultiSelect(control.$choices, items);
            break;
          case 'eq':
            control.input = renderSelect(control.$choices, control.column, items);
            break;
          default:
            control.input = renderRegion(control.$choices, control.column, items);
        }
        control.input.setValue(control.value);
        control.$status.empty().addClass('layui-hide');
      } catch (error) {
        if (this.closed) {
          return;
        }
        control.failed = true;
        control.$status.empty().text((error.message || '加载失败') + ' ');
        const $retry = $('<button type="button" class="layui-btn layui-btn-xs layui-btn-primary">重试</button>');
        $retry.appendTo(control.$status).on('click', function() {
          that.loadOptions(control);
        });
      } finally {
        control.loading = false;
        if (!this.closed) {
          this.updateStatus();
        }
      }
    },

    bindEvents: function() {
      const that = this;
      this.$add.on('click', function() {
        that.addField(that.$fieldSelect.val());
      });
      this.$form.on('submit', function(event) {
        event.preventDefault();
      });
    },

    updateStatus: function() {
      const optionsUnavailable = this.controls.some(function(control) {
        return control.loading || control.failed;
      });
      const queryDisabled = this.submitting || optionsUnavailable;
      this.$submit.prop('disabled', queryDisabled).toggleClass('layui-btn-disabled', queryDisabled);
      this.$reset.prop('disabled', this.submitting).toggleClass('layui-btn-disabled', this.submitting);
    },

    reset: function() {
      this.controls.forEach(function(control) {
        control.value = undefined;
        if (control.input) {
          control.input.setValue(undefined);
        }
      });
      this.$error.empty().addClass('layui-hide');
    },

    submit: async function() {
      if (this.$submit.prop('disabled')) {
        return;
      }
      this.$error.empty().addClass('layui-hide');

      try {
        const entries = this.controls.map(function(control) {
          return [control.column.field, control.input.getValue()];
        });
        const values = Object.fromEntries(entries);
        const where = serialize(this.columns, values);
        this.submitting = true;
        this.updateStatus();

        let shouldReload = true;
        if (this.options.onsubmit) {
          const result = await this.options.onsubmit(where);
          shouldReload = result !== false;
        }
        if (this.closed) {
          return;
        }
        if (shouldReload) {
          const tableConfig = table.getOptions(this.tableId) || {};
          table.reload(this.tableId, {
            where: Object.assign({}, tableConfig.where, where),
            page: {curr: 1}
          });
        }
        filterValues[this.tableId] = where;
        layer.close(this.layerIndex);
      } catch (error) {
        this.$error.removeClass('layui-hide').text(error.message || '查询失败，请重试');
      } finally {
        this.submitting = false;
        if (!this.closed) {
          this.updateStatus();
        }
      }
    }
  };

  form.on('select(advanced-filter-select)', function(data) {
    $(data.elem).trigger('change');
  });

  exports('advancedFilter', {
    open: function(options) {
      return new AdvancedFilter(options || {}).render();
    },
    serialize: serialize
  });
});