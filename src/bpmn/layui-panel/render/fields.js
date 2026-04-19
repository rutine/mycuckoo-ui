import {
  appendClassName,
  normalizeText,
  removeClassName,
  toggleClassName
} from '../utils.js';

const LISTENER_EVENT_OPTIONS = [
  { value: 'assignment', label: '任务分派事件' },
  { value: 'create', label: '创建事件' },
  { value: 'complete', label: '完成事件' },
  { value: 'delete', label: '删除事件' },
  { value: 'all', label: '所有事件' }
];

const LISTENER_TYPE_OPTIONS = [
  { value: 'expression', label: '表达式' },
  { value: 'class', label: '类' },
  { value: 'delegateExpression', label: '代理表达式' }
];

const LAYUI_SELECT_BINDING_PROP = '__layuiSelectBinding';
const LAYUI_SELECT_FILTER_PROP = '__layuiSelectFilter';

function appendPreviewLine(documentRef, mountEl, text, modifierClass = '') {
  const lineEl = documentRef.createElement('div');
  lineEl.className = `layui-bpmn-panel__entry-preview${modifierClass ? ` ${modifierClass}` : ''}`;
  lineEl.textContent = text;
  mountEl.appendChild(lineEl);
}

function readEntryValue(entry) {
  if (!entry || typeof entry.getValue !== 'function') {
    return null;
  }

  try {
    return entry.getValue();
  } catch (error) {
    return null;
  }
}

function isEditableEntry(entry) {
  return !!(entry && (
    entry.component === 'TextInput' ||
    entry.component === 'ExpressionEditor'
  ));
}

function normalizeMultiInstanceDraft(value) {
  const draft = value && typeof value === 'object' ? value : {};

  return {
    enabled: draft.enabled === true,
    isSequential: draft.isSequential === true,
    collection: normalizeText(draft.collection),
    elementVariable: normalizeText(draft.elementVariable),
    loopCardinality: normalizeText(draft.loopCardinality),
    completionCondition: normalizeText(draft.completionCondition),
    assigneeMode: normalizeText(draft.assigneeMode),
    ids: normalizeText(draft.ids),
    names: normalizeText(draft.names)
  };
}

function getValidationFieldMessage(validation, field) {
  if (!validation || typeof validation !== 'object') {
    return '';
  }

  const errors = validation.errors;

  if (!errors || typeof errors !== 'object') {
    return '';
  }

  const target = errors[field];

  if (typeof target === 'string' && target) {
    return target;
  }

  if (target && typeof target.message === 'string' && target.message) {
    return target.message;
  }

  return '';
}

function createEditableControl(documentRef, entry, value) {
  const isExpression = entry && entry.component === 'ExpressionEditor';
  const controlEl = documentRef.createElement(isExpression ? 'textarea' : 'input');
  controlEl.className = isExpression ? 'layui-textarea' : 'layui-input';
  controlEl.value = normalizeText(value);
  controlEl.dataset.entryKey = entry && entry.key ? entry.key : '';
  controlEl.dataset.component = entry && entry.component ? entry.component : '';

  return controlEl;
}

function createErrorElement(documentRef) {
  const errorEl = documentRef.createElement('div');
  errorEl.className = 'layui-bpmn-panel__entry-error';
  errorEl.textContent = '';

  return errorEl;
}

function getFirstErrorMessage(errors) {
  if (!errors || typeof errors !== 'object') {
    return '';
  }

  const values = Object.values(errors);

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (typeof value === 'string' && value) {
      return value;
    }

    if (value && typeof value.message === 'string' && value.message) {
      return value.message;
    }
  }

  return '';
}

function toValidationMessage(result) {
  if (!result) {
    return '';
  }

  if (typeof result === 'string') {
    return result;
  }

  if (result.valid === false) {
    if (typeof result.message === 'string' && result.message) {
      return result.message;
    }

    const errorMessage = getFirstErrorMessage(result.errors);

    return errorMessage || '输入不合法';
  }

  return '';
}

function setEntryError(controlEl, errorEl, message) {
  const nextMessage = normalizeText(message).trim();
  const hasDangerClass = /\blayui-form-danger\b/.test(controlEl.className);

  errorEl.textContent = nextMessage;

  if (nextMessage && !hasDangerClass) {
    controlEl.className = `${controlEl.className} layui-form-danger`.trim();
    return;
  }

  if (!nextMessage && hasDangerClass) {
    controlEl.className = controlEl.className.replace(/\s*layui-form-danger\b/g, '').trim();
  }
}

function bindEditableEvents(controlEl, errorEl, entry, initialValue) {
  let lastCommittedValue = normalizeText(initialValue);

  function submitValue() {
    const nextValue = normalizeText(controlEl.value);

    if (nextValue === lastCommittedValue) {
      return;
    }

    const validation = typeof entry.validate === 'function'
      ? entry.validate(nextValue)
      : null;
    const validationMessage = toValidationMessage(validation);

    if (validationMessage) {
      setEntryError(controlEl, errorEl, validationMessage);
      return;
    }

    const result = typeof entry.setValue === 'function'
      ? entry.setValue(nextValue)
      : { updated: false };
    const resultMessage = toValidationMessage(result && result.validation);

    setEntryError(controlEl, errorEl, resultMessage);

    if (result && result.updated) {
      lastCommittedValue = nextValue;
    }
  }

  controlEl.addEventListener('blur', submitValue);
  controlEl.addEventListener('keydown', (event) => {
    if (controlEl.tagName === 'input' && event && event.key === 'Enter') {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      submitValue();
    }
  });
}

function renderEditableEntry(documentRef, mountEl, entry) {
  const value = readEntryValue(entry);
  const controlEl = createEditableControl(documentRef, entry, value);
  const errorEl = createErrorElement(documentRef);

  bindEditableEvents(controlEl, errorEl, entry, value);

  mountEl.appendChild(controlEl);
  mountEl.appendChild(errorEl);
}

function createMultiInstanceFieldContainer(documentRef, field) {
  const containerEl = documentRef.createElement('div');
  containerEl.className = 'layui-bpmn-panel__multi-instance-field';
  containerEl.dataset.field = field;

  return containerEl;
}

function createLabeledControl(documentRef, field, labelText, controlEl, options = {}) {
  const fieldEl = createMultiInstanceFieldContainer(documentRef, field);
  const labelEl = documentRef.createElement('label');
  const labelTextEl = documentRef.createElement('span');
  const mountEl = documentRef.createElement('div');
  const errorEl = createErrorElement(documentRef);

  if (options.kind === 'switch') {
    appendClassName(fieldEl, 'layui-bpmn-panel__multi-instance-field--switch');
  }

  appendClassName(fieldEl, 'layui-form-item');
  labelEl.className = 'layui-form-label layui-bpmn-panel__entry-label';
  labelTextEl.textContent = labelText;
  labelEl.appendChild(labelTextEl);

  let labelMetaEl = null;

  if (options.metaText !== undefined) {
    labelMetaEl = documentRef.createElement('span');
    labelMetaEl.className = 'layui-badge layui-badge-rim layui-bpmn-panel__entry-label-meta';
    labelMetaEl.textContent = normalizeText(options.metaText);
    labelEl.appendChild(labelMetaEl);
  }

  let labelActionEl = null;

  if (options.actionText !== undefined) {
    labelActionEl = documentRef.createElement('button');
    labelActionEl.type = 'button';
    labelActionEl.className = 'layui-btn layui-btn-xs layui-btn-primary layui-bpmn-panel__entry-label-action';
    labelActionEl.textContent = normalizeText(options.actionText);

    if (options.actionName) {
      labelActionEl.dataset.action = options.actionName;
    }

    labelEl.appendChild(labelActionEl);
  }

  mountEl.className = 'layui-input-block layui-bpmn-panel__multi-instance-field-mount';

  fieldEl.appendChild(labelEl);
  mountEl.appendChild(controlEl);
  mountEl.appendChild(errorEl);
  fieldEl.appendChild(mountEl);

  return {
    fieldEl,
    labelEl,
    labelTextEl,
    labelMetaEl,
    labelActionEl,
    mountEl,
    controlEl,
    errorEl
  };
}

function setMultiInstanceFieldErrors(fieldBindings, validation) {
  Object.keys(fieldBindings).forEach((field) => {
    const binding = fieldBindings[field];
    const message = getValidationFieldMessage(validation, field);
    setEntryError(binding.controlEl, binding.errorEl, message);
  });
}

function clearMultiInstanceFieldErrors(fieldBindings) {
  setMultiInstanceFieldErrors(fieldBindings, null);
}

function normalizeListenerDraft(value = {}) {
  return {
    event: normalizeText(value.event).trim() || 'assignment',
    type: normalizeText(value.type).trim() || 'expression',
    value: normalizeText(value.value)
  };
}

function normalizeListenerEditorValue(value) {
  const items = value && Array.isArray(value.items) ? value.items : [];

  return {
    items: items.map((item) => normalizeListenerDraft(item))
  };
}

function createListenerButton(documentRef, action, text, modifierClass = '') {
  const buttonEl = documentRef.createElement('button');
  buttonEl.type = 'button';
  buttonEl.className = `layui-btn layui-btn-sm${modifierClass ? ` ${modifierClass}` : ''}`;
  buttonEl.dataset.action = action;
  buttonEl.textContent = text;

  return buttonEl;
}

function applySelectMode(selectEl, options = {}) {
  const selectMode = options.selectMode || 'native';

  if (selectMode === 'layui') {
    selectEl[LAYUI_SELECT_FILTER_PROP] = options.layFilter || '';

    if (typeof selectEl.setAttribute === 'function' && options.layFilter) {
      selectEl.setAttribute('lay-filter', options.layFilter);
    }

    return;
  }

  if (typeof selectEl.setAttribute === 'function') {
    selectEl.setAttribute('lay-ignore', '');
  }
}

function setLayuiSelectBinding(selectEl, onChange) {
  if (!selectEl || typeof onChange !== 'function') {
    return;
  }

  const layFilter = typeof selectEl.getAttribute === 'function'
    ? normalizeText(selectEl.getAttribute('lay-filter')).trim()
    : normalizeText(selectEl[LAYUI_SELECT_FILTER_PROP]).trim();

  if (!layFilter) {
    return;
  }

  selectEl[LAYUI_SELECT_BINDING_PROP] = {
    element: selectEl,
    filter: layFilter,
    onChange
  };
}

function createListenerSelect(documentRef, field, options, value, selectOptions = {}) {
  const selectEl = documentRef.createElement('select');
  selectEl.className = 'layui-input layui-bpmn-panel__listener-select';
  selectEl.dataset.field = field;

  (options || []).forEach((option) => {
    const optionEl = documentRef.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;

    selectEl.appendChild(optionEl);
  });

  selectEl.value = normalizeText(value);
  applySelectMode(selectEl, selectOptions);

  return selectEl;
}

function createMultiInstanceSelect(documentRef, field, options, value, selectOptions = {}) {
  const selectEl = documentRef.createElement('select');
  selectEl.className = 'layui-input';
  selectEl.dataset.field = field;

  (options || []).forEach((option) => {
    const optionEl = documentRef.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    selectEl.appendChild(optionEl);
  });

  selectEl.value = normalizeText(value);
  applySelectMode(selectEl, selectOptions);

  return selectEl;
}

function createMultiInstanceButton(documentRef, action, text) {
  const buttonEl = documentRef.createElement('button');
  buttonEl.type = 'button';
  buttonEl.className = 'layui-btn layui-btn-sm layui-bpmn-panel__multi-instance-picker-btn';
  buttonEl.dataset.action = action;
  buttonEl.textContent = text;

  return buttonEl;
}

function createMultiInstanceButtonRow(documentRef, ...buttons) {
  const rowEl = documentRef.createElement('div');
  rowEl.className = 'layui-bpmn-panel__multi-instance-button-row';

  buttons.filter(Boolean).forEach((buttonEl) => {
    rowEl.appendChild(buttonEl);
  });

  return rowEl;
}

function renderMultiInstancePreviewValue(previewEl, value) {
  const names = getMultiInstanceSelectedNames(value);

  previewEl.innerHTML = '';

  if (!names.length) {
    previewEl.textContent = '暂未选择用户';
    return;
  }

  names.forEach((name) => {
    const tagEl = previewEl.ownerDocument.createElement('span');
    tagEl.className = 'layui-bpmn-panel__multi-instance-tag layui-badge-rim';
    tagEl.textContent = name;
    previewEl.appendChild(tagEl);
  });
}

function getMultiInstanceSelectedNames(value) {
  const text = normalizeText(value).trim();

  return text
    ? text.split(/[,\uff0c]/).map((item) => normalizeText(item).trim()).filter(Boolean)
    : [];
}

function createMultiInstancePreview(documentRef, value) {
  const previewEl = documentRef.createElement('div');
  previewEl.className = 'layui-bpmn-panel__entry-preview layui-bpmn-panel__multi-instance-preview layui-bpmn-panel__multi-instance-preview--readonly';
  renderMultiInstancePreviewValue(previewEl, value);

  return previewEl;
}

function createListenerInput(documentRef, field, value) {
  const inputEl = documentRef.createElement('input');
  inputEl.className = 'layui-input';
  inputEl.dataset.field = field;
  inputEl.value = normalizeText(value);

  return inputEl;
}

function createListenerField(documentRef, field, labelText, controlEl) {
  const fieldEl = documentRef.createElement('div');
  const labelEl = documentRef.createElement('label');
  const mountEl = documentRef.createElement('div');
  const errorEl = createErrorElement(documentRef);

  fieldEl.className = 'layui-form-item layui-bpmn-panel__listener-field';
  fieldEl.dataset.field = field;
  labelEl.className = 'layui-form-label layui-bpmn-panel__entry-label';
  labelEl.textContent = labelText;
  mountEl.className = 'layui-input-block layui-bpmn-panel__listener-field-mount';

  mountEl.appendChild(controlEl);
  mountEl.appendChild(errorEl);
  fieldEl.appendChild(labelEl);
  fieldEl.appendChild(mountEl);

  return {
    fieldEl,
    controlEl,
    errorEl
  };
}

function setListenerFieldErrors(fieldBindings, validation) {
  Object.keys(fieldBindings).forEach((field) => {
    const binding = fieldBindings[field];
    const message = getValidationFieldMessage(validation, field);
    setEntryError(binding.controlEl, binding.errorEl, message);
  });
}

function syncListenerItems(state, value) {
  const normalizedValue = normalizeListenerEditorValue(value);
  state.items = normalizedValue.items;
}

function focusListenerValueInput(controlEl) {
  if (!controlEl || typeof controlEl.focus !== 'function') {
    return;
  }

  controlEl.focus();

  if (normalizeText(controlEl.value) && typeof controlEl.select === 'function') {
    controlEl.select();
  }
}

function renderListenerEditor(documentRef, mountEl, entry) {
  const editorEl = documentRef.createElement('div');
  const itemsEl = documentRef.createElement('div');
  const actionsEl = documentRef.createElement('div');
  const state = normalizeListenerEditorValue(readEntryValue(entry));

  editorEl.className = 'layui-bpmn-panel__listener-editor';
  editorEl.dataset.editorKind = 'listener-editor';
  itemsEl.className = 'layui-bpmn-panel__listener-items';
  actionsEl.className = 'layui-bpmn-panel__listener-actions';

  function renderItems(options = {}) {
    const focusIndex = Number.isInteger(options.focusIndex) ? options.focusIndex : -1;
    const listenerSelectMode = entry && entry.ui && entry.ui.selectMode === 'native'
      ? 'native'
      : 'layui';

    itemsEl.innerHTML = '';

    if (!state.items.length) {
      renderTextPreview(documentRef, itemsEl, '');
      return;
    }

    state.items.forEach((item, index) => {
      const itemEl = documentRef.createElement('div');
      const bodyEl = documentRef.createElement('div');
      const footerEl = documentRef.createElement('div');
      const draft = normalizeListenerDraft(item);
      let lastCommittedDraft = JSON.stringify(draft);

      itemEl.className = 'layui-bpmn-panel__listener-item';
      itemEl.dataset.listenerIndex = String(index);
      bodyEl.className = 'layui-bpmn-panel__listener-item-body';
      footerEl.className = 'layui-bpmn-panel__listener-item-footer';

      const eventField = createListenerField(
        documentRef,
        'event',
        '事件',
        createListenerSelect(documentRef, 'event', LISTENER_EVENT_OPTIONS, draft.event, {
          selectMode: listenerSelectMode,
          layFilter: `listener-event-${index}`
        })
      );
      const typeField = createListenerField(
        documentRef,
        'type',
        '监听器类型',
        createListenerSelect(documentRef, 'type', LISTENER_TYPE_OPTIONS, draft.type, {
          selectMode: listenerSelectMode,
          layFilter: `listener-type-${index}`
        })
      );
      const valueField = createListenerField(
        documentRef,
        'value',
        '值',
        createListenerInput(documentRef, 'value', draft.value)
      );
      const deleteButtonEl = createListenerButton(documentRef, 'remove-listener', '删除监听器', 'layui-btn-primary');
      const fieldBindings = {
        event: eventField,
        type: typeField,
        value: valueField
      };

      function submitDraft() {
        const nextDraft = normalizeListenerDraft({
          event: eventField.controlEl.value,
          type: typeField.controlEl.value,
          value: valueField.controlEl.value
        });
        const nextKey = JSON.stringify(nextDraft);

        if (nextKey === lastCommittedDraft) {
          return;
        }

        const validation = typeof entry.validate === 'function'
          ? entry.validate(nextDraft)
          : null;

        setListenerFieldErrors(fieldBindings, validation);

        if (validation && validation.valid === false) {
          return;
        }

        const result = typeof entry.setValue === 'function'
          ? entry.setValue({
            action: 'update',
            index,
            draft: nextDraft
          })
          : { updated: false };
        const resultValidation = result && result.validation ? result.validation : null;

        setListenerFieldErrors(fieldBindings, resultValidation);

        if (!result || !result.updated) {
          return;
        }

        lastCommittedDraft = nextKey;
        state.items[index] = nextDraft;

        if (result.value) {
          syncListenerItems(state, result.value);
          renderItems();
        }
      }

      setLayuiSelectBinding(eventField.controlEl, (nextValue) => {
        eventField.controlEl.value = normalizeText(nextValue);
        submitDraft();
      });
      setLayuiSelectBinding(typeField.controlEl, (nextValue) => {
        typeField.controlEl.value = normalizeText(nextValue);
        submitDraft();
      });
      eventField.controlEl.addEventListener('change', submitDraft);
      typeField.controlEl.addEventListener('change', submitDraft);
      valueField.controlEl.addEventListener('blur', submitDraft);
      valueField.controlEl.addEventListener('keydown', (event) => {
        if (event && event.key === 'Enter') {
          if (typeof event.preventDefault === 'function') {
            event.preventDefault();
          }

          submitDraft();
        }
      });

      deleteButtonEl.addEventListener('click', () => {
        const result = typeof entry.setValue === 'function'
          ? entry.setValue({
            action: 'remove',
            index
          })
          : { updated: false };

        if (!result || !result.updated) {
          return;
        }

        if (result.value) {
          syncListenerItems(state, result.value);
        } else {
          state.items.splice(index, 1);
        }

        renderItems();
      });

      bodyEl.appendChild(eventField.fieldEl);
      bodyEl.appendChild(typeField.fieldEl);
      bodyEl.appendChild(valueField.fieldEl);
      footerEl.appendChild(deleteButtonEl);
      itemEl.appendChild(bodyEl);
      itemEl.appendChild(footerEl);
      itemsEl.appendChild(itemEl);

      if (index === focusIndex) {
        focusListenerValueInput(valueField.controlEl);
      }
    });
  }

  const addButtonEl = createListenerButton(documentRef, 'add-listener', '新增监听器');

  addButtonEl.addEventListener('click', () => {
    const result = typeof entry.setValue === 'function'
      ? entry.setValue({ action: 'add' })
      : { updated: false };

    if (!result || !result.updated) {
      return;
    }

    if (result.value) {
      syncListenerItems(state, result.value);
    } else {
      state.items.push(normalizeListenerDraft());
    }

    renderItems({
      focusIndex: state.items.length - 1
    });
  });

  renderItems();
  actionsEl.appendChild(addButtonEl);
  editorEl.appendChild(itemsEl);
  editorEl.appendChild(actionsEl);
  mountEl.appendChild(editorEl);
}

function createMultiInstanceSwitch(documentRef, checked, options = {}) {
  const inputEl = documentRef.createElement('input');

  inputEl.type = 'checkbox';
  inputEl.className = 'layui-bpmn-panel__multi-instance-switch';
  inputEl.checked = !!checked;
  inputEl.dataset.field = options.field || '';

  if (typeof inputEl.setAttribute === 'function') {
    inputEl.setAttribute('lay-skin', 'switch');
    inputEl.setAttribute('lay-text', options.layText || '串行|并行');
  }

  return inputEl;
}

function setControlDisabled(controlEl, disabled) {
  if (!controlEl) {
    return;
  }

  controlEl.disabled = !!disabled;
}

function setMultiInstanceFieldDisabled(binding, disabled) {
  if (!binding) {
    return;
  }

  setControlDisabled(binding.controlEl, disabled);
  toggleClassName(binding.fieldEl, 'layui-bpmn-panel__multi-instance-field--disabled', !!disabled);
}

function renderMultiInstanceEditor(documentRef, mountEl, entry) {
  const editorEl = documentRef.createElement('div');
  const fieldsEl = documentRef.createElement('div');
  let draft = normalizeMultiInstanceDraft(readEntryValue(entry));

  editorEl.className = 'layui-bpmn-panel__multi-instance-editor';
  editorEl.dataset.editorKind = 'multi-instance';
  fieldsEl.className = 'layui-bpmn-panel__multi-instance-fields';

  const enabledInputEl = createMultiInstanceSwitch(documentRef, draft.enabled, {
    field: 'enabled',
    layText: '开启|关闭'
  });
  const isSequentialInputEl = createMultiInstanceSwitch(documentRef, draft.isSequential, {
    field: 'isSequential',
    layText: '串行|并行'
  });
  const assigneeModeSelectEl = createMultiInstanceSelect(documentRef, 'assigneeMode', [
    { value: '', label: '动态变量' },
    { value: 'user', label: '固定用户' }
  ], draft.assigneeMode, {
    selectMode: 'native'
  });
  const pickUsersButtonEl = createMultiInstanceButton(documentRef, 'pick-users', '选择固定用户');
  const clearUsersButtonEl = createMultiInstanceButton(documentRef, 'clear-users', '清空');
  appendClassName(clearUsersButtonEl, 'layui-btn-primary');
  appendClassName(clearUsersButtonEl, 'layui-bpmn-panel__multi-instance-clear-btn');
  const pickUsersControlsEl = createMultiInstanceButtonRow(documentRef, pickUsersButtonEl, clearUsersButtonEl);

  const collectionInputEl = documentRef.createElement('input');
  collectionInputEl.className = 'layui-input';
  collectionInputEl.value = draft.collection;

  const elementVariableInputEl = documentRef.createElement('input');
  elementVariableInputEl.className = 'layui-input';
  elementVariableInputEl.value = draft.elementVariable;

  const loopCardinalityInputEl = documentRef.createElement('input');
  loopCardinalityInputEl.className = 'layui-input';
  loopCardinalityInputEl.value = draft.loopCardinality;

  const completionConditionEl = documentRef.createElement('textarea');
  completionConditionEl.className = 'layui-textarea';
  completionConditionEl.value = draft.completionCondition;
  const namesPreviewEl = createMultiInstancePreview(documentRef, draft.names);

  const enabledField = createLabeledControl(documentRef, 'enabled', '开启多实例', enabledInputEl, {
    kind: 'switch'
  });
  const isSequentialField = createLabeledControl(documentRef, 'isSequential', '串行执行', isSequentialInputEl, {
    kind: 'switch'
  });
  const assigneeModeField = createLabeledControl(documentRef, 'assigneeMode', '人员模式', assigneeModeSelectEl);
  const collectionField = createLabeledControl(documentRef, 'collection', '集合变量', collectionInputEl);
  const elementVariableField = createLabeledControl(documentRef, 'elementVariable', '元素变量', elementVariableInputEl);
  const idsField = createLabeledControl(documentRef, 'ids', '选择用户', pickUsersControlsEl);
  const namesField = createLabeledControl(documentRef, 'names', '已选用户', namesPreviewEl);
  const loopCardinalityField = createLabeledControl(documentRef, 'loopCardinality', '循环次数', loopCardinalityInputEl);
  const completionConditionField = createLabeledControl(
    documentRef,
    'completionCondition',
    '完成条件',
    completionConditionEl
  );

  const fieldBindings = {
    enabled: enabledField,
    isSequential: isSequentialField,
    assigneeMode: assigneeModeField,
    collection: collectionField,
    elementVariable: elementVariableField,
    ids: idsField,
    loopCardinality: loopCardinalityField,
    completionCondition: completionConditionField
  };

  appendClassName(idsField.fieldEl, 'layui-bpmn-panel__multi-instance-field--picker');
  appendClassName(idsField.fieldEl, 'layui-bpmn-panel__multi-instance-field--no-label');
  appendClassName(namesField.fieldEl, 'layui-bpmn-panel__multi-instance-field--no-label');

  function syncNamesPreview() {
    renderMultiInstancePreviewValue(namesPreviewEl, draft.names);
  }

  function syncUserButtonsState() {
    const count = getMultiInstanceSelectedNames(draft.names).length;
    const isUserMode = draft.assigneeMode === 'user';
    const disabled = !draft.enabled;

    pickUsersButtonEl.disabled = disabled;
    clearUsersButtonEl.disabled = disabled || !isUserMode || count === 0;
    clearUsersButtonEl.hidden = !isUserMode;
  }

  function syncAssigneeModeFields() {
    const isUserMode = draft.assigneeMode === 'user';

    idsField.fieldEl.hidden = !isUserMode;
    namesField.fieldEl.hidden = !isUserMode;
  }

  function syncFieldAvailability() {
    const disabled = !draft.enabled;

    setMultiInstanceFieldDisabled(isSequentialField, disabled);
    setMultiInstanceFieldDisabled(assigneeModeField, disabled);
    setMultiInstanceFieldDisabled(idsField, disabled || draft.assigneeMode !== 'user');
    setMultiInstanceFieldDisabled(namesField, disabled || draft.assigneeMode !== 'user');
    setMultiInstanceFieldDisabled(collectionField, disabled);
    setMultiInstanceFieldDisabled(elementVariableField, disabled);
    setMultiInstanceFieldDisabled(loopCardinalityField, disabled);
    setMultiInstanceFieldDisabled(completionConditionField, disabled);
    syncUserButtonsState();
  }

  function applyDraftChange(nextDraft, options = {}) {
    const validation = options.skipValidation
      ? { valid: true }
      : (typeof entry.validate === 'function' ? entry.validate(nextDraft) : { valid: true });

    if (!options.skipValidation) {
      setMultiInstanceFieldErrors(fieldBindings, validation);
    }

    if (validation && validation.valid === false) {
      return {
        updated: false,
        validation
      };
    }

    const result = typeof entry.setValue === 'function'
      ? entry.setValue(nextDraft)
      : { updated: false };

    setMultiInstanceFieldErrors(fieldBindings, result && result.validation);

    if (result && result.updated === true) {
      draft = normalizeMultiInstanceDraft(nextDraft);
    }

    return result;
  }

  function bindCommitOnBlur(controlEl, onReadValue) {
    function commitValue() {
      if (!draft.enabled) {
        return;
      }

      const nextDraft = {
        ...draft,
        ...onReadValue()
      };

      const result = applyDraftChange(nextDraft);

      if (result && result.updated === true) {
        syncFieldAvailability();
      }
    }

    controlEl.addEventListener('blur', commitValue);
    controlEl.addEventListener('change', commitValue);
    controlEl.addEventListener('keydown', (event) => {
      if (String(controlEl.tagName || '').toLowerCase() === 'input' && event && event.key === 'Enter') {
        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }

        commitValue();
      }
    });
  }

  fieldsEl.appendChild(enabledField.fieldEl);
  fieldsEl.appendChild(isSequentialField.fieldEl);
  fieldsEl.appendChild(assigneeModeField.fieldEl);
  fieldsEl.appendChild(idsField.fieldEl);
  fieldsEl.appendChild(namesField.fieldEl);
  fieldsEl.appendChild(collectionField.fieldEl);
  fieldsEl.appendChild(elementVariableField.fieldEl);
  fieldsEl.appendChild(loopCardinalityField.fieldEl);
  fieldsEl.appendChild(completionConditionField.fieldEl);

  editorEl.appendChild(fieldsEl);
  mountEl.appendChild(editorEl);

  syncNamesPreview();
  syncUserButtonsState();
  syncAssigneeModeFields();
  syncFieldAvailability();

  enabledInputEl.addEventListener('change', () => {
    if (!!enabledInputEl.checked === !!draft.enabled) {
      syncFieldAvailability();
      return;
    }

    const previousDraft = { ...draft };
    const nextDraft = {
      ...draft,
      enabled: !!enabledInputEl.checked
    };

    draft = normalizeMultiInstanceDraft(nextDraft);
    syncFieldAvailability();

    const result = nextDraft.enabled
      ? applyDraftChange(nextDraft)
      : applyDraftChange(nextDraft, { skipValidation: true });

    if (result && result.updated === true) {
      clearMultiInstanceFieldErrors(fieldBindings);
      syncFieldAvailability();
      return;
    }

    if (!nextDraft.enabled) {
      draft = normalizeMultiInstanceDraft(previousDraft);
      enabledInputEl.checked = !!draft.enabled;
      syncFieldAvailability();
    }
  });

  isSequentialInputEl.addEventListener('change', () => {
    draft.isSequential = !!isSequentialInputEl.checked;

    if (!draft.enabled) {
      return;
    }

    applyDraftChange({
      ...draft
    });
  });

  function handleAssigneeModeChange(nextValue) {
    draft.assigneeMode = normalizeText(nextValue).trim();
    assigneeModeSelectEl.value = draft.assigneeMode;

    if (draft.assigneeMode !== 'user') {
      draft.ids = '';
      draft.names = '';
    }

    syncNamesPreview();
    syncUserButtonsState();
    syncAssigneeModeFields();
    syncFieldAvailability();

    if (!draft.enabled) {
      return;
    }

    if (draft.assigneeMode === 'user' && !normalizeText(draft.ids).trim()) {
      clearMultiInstanceFieldErrors(fieldBindings);
      return;
    }

    applyDraftChange({
      ...draft
    });
  }

  assigneeModeSelectEl.addEventListener('change', () => {
    handleAssigneeModeChange(assigneeModeSelectEl.value);
  });

  collectionInputEl.addEventListener('input', () => {
    draft.collection = normalizeText(collectionInputEl.value);

    if (draft.enabled) {
      applyDraftChange({
        ...draft
      });
    }
  });
  elementVariableInputEl.addEventListener('input', () => {
    draft.elementVariable = normalizeText(elementVariableInputEl.value);

    if (draft.enabled) {
      applyDraftChange({
        ...draft
      });
    }
  });

  loopCardinalityInputEl.addEventListener('input', () => {
    draft.loopCardinality = normalizeText(loopCardinalityInputEl.value);

    if (draft.enabled) {
      applyDraftChange({
        ...draft
      });
    }
  });

  completionConditionEl.addEventListener('input', () => {
    draft.completionCondition = normalizeText(completionConditionEl.value);

    if (draft.enabled) {
      applyDraftChange({
        ...draft
      });
    }
  });

  clearUsersButtonEl.addEventListener('click', () => {
    if (!draft.enabled || draft.assigneeMode !== 'user') {
      return;
    }

    draft.ids = '';
    draft.names = '';

    syncNamesPreview();
    syncUserButtonsState();

    applyDraftChange({
      ...draft
    });
  });

  pickUsersButtonEl.addEventListener('click', async () => {
    if (!draft.enabled || typeof entry.pickUsers !== 'function') {
      return;
    }

    let pickedUsers = null;

    try {
      pickedUsers = await entry.pickUsers({ ...draft });
    } catch (error) {
      return;
    }

    if (!Array.isArray(pickedUsers)) {
      return;
    }

    draft.assigneeMode = 'user';
    draft.ids = pickedUsers
      .map((user) => user && user.id)
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
      .map((value) => String(value).trim())
      .join(',');
    draft.names = pickedUsers
      .map((user) => user && user.name)
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
      .map((value) => String(value).trim())
      .join(',');

    assigneeModeSelectEl.value = draft.assigneeMode;
    syncNamesPreview();
    syncUserButtonsState();
    syncAssigneeModeFields();
    syncFieldAvailability();

    applyDraftChange({
      ...draft
    });
  });

  bindCommitOnBlur(collectionInputEl, () => ({
    collection: normalizeText(collectionInputEl.value)
  }));
  bindCommitOnBlur(elementVariableInputEl, () => ({
    elementVariable: normalizeText(elementVariableInputEl.value)
  }));
  bindCommitOnBlur(loopCardinalityInputEl, () => ({
    loopCardinality: normalizeText(loopCardinalityInputEl.value)
  }));
  completionConditionEl.addEventListener('blur', () => {
    if (!draft.enabled) {
      return;
    }

    applyDraftChange({
      ...draft,
      completionCondition: normalizeText(completionConditionEl.value)
    });
  });
}

function renderTextPreview(documentRef, mountEl, value) {
  const text = normalizeText(value).trim();

  appendPreviewLine(documentRef, mountEl, text || '-', text ? '' : 'layui-bpmn-panel__entry-preview--empty');
}

function renderParameterPreview(documentRef, mountEl, value) {
  const items = value && Array.isArray(value.items) ? value.items : [];

  if (!items.length) {
    renderTextPreview(documentRef, mountEl, '');
    return;
  }

  items.forEach((item) => {
    const name = normalizeText(item && item.name).trim() || '(unnamed)';
    const parameterValue = normalizeText(item && item.value);
    appendPreviewLine(documentRef, mountEl, `${name} = ${parameterValue}`);
  });
}

function renderListenerPreview(documentRef, mountEl, value) {
  const items = value && Array.isArray(value.items) ? value.items : [];

  if (!items.length) {
    renderTextPreview(documentRef, mountEl, '');
    return;
  }

  items.forEach((item) => {
    const event = normalizeText(item && item.event).trim() || '(event)';
    const type = normalizeText(item && item.type).trim() || '(type)';
    const listenerValue = normalizeText(item && item.value);
    appendPreviewLine(documentRef, mountEl, `${event} / ${type}: ${listenerValue}`);
  });
}

function renderExtensionPreview(documentRef, mountEl, value) {
  const items = value && Array.isArray(value.items) ? value.items : [];

  if (!items.length) {
    renderTextPreview(documentRef, mountEl, '');
    return;
  }

  items.forEach((item) => {
    const parameterName = normalizeText(item && item.parameterName).trim() || '(parameter)';
    const key = normalizeText(item && item.key).trim() || '(key)';
    appendPreviewLine(documentRef, mountEl, `${parameterName}.${key}`);
  });
}

function renderMultiInstancePreview(documentRef, mountEl, value) {
  if (!value || typeof value !== 'object' || !value.enabled) {
    renderTextPreview(documentRef, mountEl, '');
    return;
  }

  if (normalizeText(value.assigneeMode).trim() === 'user') {
    appendPreviewLine(documentRef, mountEl, `users: ${normalizeText(value.names)}`);
    return;
  }

  appendPreviewLine(documentRef, mountEl, `collection: ${normalizeText(value.collection)}`);
  appendPreviewLine(documentRef, mountEl, `elementVariable: ${normalizeText(value.elementVariable)}`);
}

function renderEntryPreview(documentRef, mountEl, entry) {
  const value = readEntryValue(entry);

  switch (entry && entry.component) {
  case 'ParameterEditor':
    renderParameterPreview(documentRef, mountEl, value);
    break;
  case 'ListenerEditor':
    renderListenerPreview(documentRef, mountEl, value);
    break;
  case 'ExtensionEditor':
    renderExtensionPreview(documentRef, mountEl, value);
    break;
  case 'MultiInstanceEditor':
    renderMultiInstancePreview(documentRef, mountEl, value);
    break;
  case 'ExpressionEditor':
  case 'TextInput':
  default:
    renderTextPreview(documentRef, mountEl, value);
    break;
  }
}

function renderEntryContent(documentRef, mountEl, entry) {
  if (entry && entry.component === 'MultiInstanceEditor') {
    renderMultiInstanceEditor(documentRef, mountEl, entry);
    return;
  }

  if (entry && entry.component === 'ListenerEditor') {
    renderListenerEditor(documentRef, mountEl, entry);
    return;
  }

  if (isEditableEntry(entry)) {
    renderEditableEntry(documentRef, mountEl, entry);
    return;
  }

  renderEntryPreview(documentRef, mountEl, entry);
}

function isEmbeddedEntry(entry) {
  return !!(entry && (
    entry.component === 'MultiInstanceEditor' ||
    entry.component === 'ListenerEditor'
  ));
}

export function renderFieldGroup(group) {
  const documentRef = document;
  const groupContent = document.createElement('div');
  groupContent.className = 'layui-colla-content layui-show layui-bpmn-panel__group-content';
  groupContent.dataset.groupId = group && group.id ? group.id : '';

  const groupFields = document.createElement('div');
  groupFields.className = 'layui-bpmn-panel__group-fields';
  groupFields.dataset.groupId = group && group.id ? group.id : '';

  const entries = group && Array.isArray(group.entries) ? group.entries : [];

  entries.forEach((entry) => {
    const entryEl = document.createElement('div');
    entryEl.className = 'layui-form-item layui-bpmn-panel__entry';
    entryEl.dataset.entryKey = entry.key || '';
    entryEl.dataset.component = entry.component || '';
    entryEl.dataset.groupId = group && group.id ? group.id : '';

    const labelEl = document.createElement('label');
    labelEl.className = 'layui-form-label layui-bpmn-panel__entry-label';
    labelEl.textContent = entry.label || entry.key || '';

    const mountEl = document.createElement('div');
    mountEl.className = 'layui-input-block layui-bpmn-panel__entry-mount';
    mountEl.dataset.entryKey = entry.key || '';
    mountEl.dataset.component = entry.component || '';
    renderEntryContent(documentRef, mountEl, entry);

    if (isEmbeddedEntry(entry)) {
      appendClassName(entryEl, 'layui-bpmn-panel__entry--embedded');
      appendClassName(mountEl, 'layui-bpmn-panel__entry-mount--embedded');
    } else {
      entryEl.appendChild(labelEl);
    }

    entryEl.appendChild(mountEl);
    groupFields.appendChild(entryEl);
  });

  groupContent.appendChild(groupFields);

  return groupContent;
}

export function collectLayuiSelectBindings(root) {
  const bindings = [];

  (function walk(node) {
    if (!node) {
      return;
    }

    const binding = node[LAYUI_SELECT_BINDING_PROP];

    if (binding && binding.filter && typeof binding.onChange === 'function') {
      bindings.push(binding);
    }

    const children = node && node.children ? Array.from(node.children) : [];
    children.forEach((child) => walk(child));
  })(root);

  return bindings;
}

export default renderFieldGroup;
