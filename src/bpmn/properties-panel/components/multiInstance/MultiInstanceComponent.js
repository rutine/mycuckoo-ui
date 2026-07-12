import {toggleClassName, toStr} from '../../common/utils.js';
import {escapeHtml, renderHtml} from '../../common/html.js';
import {getFieldValidationMessage, setControlError} from "../../common/errors";

import {
  applyPickedUsersToValue,
  createMultiInstanceProperties,
  createState,
  getMultiInstanceSelectedNames
} from './MultiInstanceState.js';
import writer from './MultiInstanceWriter.js';


function previewUI(value) {
  const names = getMultiInstanceSelectedNames(value);

  if (!names.length) {
    return '暂未选择用户';
  }

  return names.map((name) =>
      `<span class="layui-bpmn-panel__multi-instance-tag layui-badge-rim">${escapeHtml(name)}</span>`
  ).join('');
}

function editorUI(state) {
  return `
    <div class="layui-bpmn-panel__multi-instance-editor" data-editor-kind="multi-instance">
    <div class="layui-bpmn-panel__multi-instance-fields">

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field layui-bpmn-panel__multi-instance-field--switch" data-field="enabled">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>开启多实例</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <input type="checkbox" class="layui-bpmn-panel__multi-instance-switch" data-field="enabled" lay-skin="switch" lay-text="开启|关闭">
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field layui-bpmn-panel__multi-instance-field--switch" data-field="isSequential">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>串行执行</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <input type="checkbox" class="layui-bpmn-panel__multi-instance-switch" data-field="isSequential" lay-skin="switch" lay-text="串行|并行">
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field" data-field="assigneeMode">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>人员模式</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <select class="layui-input" data-field="assigneeMode" lay-ignore>
        <option value="">动态变量</option>
        <option value="user">固定用户</option>
        </select>
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field layui-bpmn-panel__multi-instance-field--picker layui-bpmn-panel__multi-instance-field--no-label" data-field="ids">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>选择用户</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <div class="layui-bpmn-panel__multi-instance-button-row" data-field="ids">
          <button type="button" class="layui-btn layui-btn-sm layui-bpmn-panel__multi-instance-picker-btn" data-action="pick-users">选择固定用户</button>
          <button type="button" class="layui-btn layui-btn-sm layui-bpmn-panel__multi-instance-picker-btn layui-btn-primary layui-bpmn-panel__multi-instance-clear-btn" data-action="clear-users">清空</button>
        </div>
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field layui-bpmn-panel__multi-instance-field--no-label" data-field="names">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>已选用户</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <div class="layui-bpmn-panel__entry-preview layui-bpmn-panel__multi-instance-preview layui-bpmn-panel__multi-instance-preview--readonly" data-field="names">
          ${previewUI(state.names)}
        </div>
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field" data-field="collection">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>集合变量</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <input type="text" class="layui-input" data-field="collection">
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field" data-field="elementVariable">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>元素变量</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <input type="text" class="layui-input" data-field="elementVariable">
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field" data-field="loopCardinality">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>循环次数</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <input type="text" class="layui-input" data-field="loopCardinality">
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    <div class="layui-form-item layui-bpmn-panel__multi-instance-field" data-field="completionCondition">
      <label class="layui-form-label layui-bpmn-panel__entry-label"><span>完成条件</span></label>
      <div class="layui-input-block layui-bpmn-panel__multi-instance-field-mount">
        <textarea class="layui-textarea" data-field="completionCondition"></textarea>
        <div class="layui-bpmn-panel__entry-error"></div>
      </div>
    </div>

    </div>
    </div>`;
}

function renderPreviewValue(previewEl, value) {
  renderHtml(previewEl, previewUI(value));
}

function getBindingFieldEls(editorEl, field) {
  const fieldEl = editorEl.querySelector(`.layui-bpmn-panel__multi-instance-field[data-field="${field}"]`);
  const controlEl = fieldEl.querySelector(`[data-field="${field}"]`);
  const errorEl = fieldEl.querySelector('.layui-bpmn-panel__entry-error');

  return {fieldEl, controlEl, errorEl};
}

function setControlDisabled(binding, disabled) {
  if (!binding) {
    return;
  }
  if (binding.controlEl) {
    binding.controlEl.disabled = !!disabled;
  }

  toggleClassName(binding.fieldEl, 'layui-bpmn-panel__multi-instance-field--disabled', !!disabled);
}

function setMultiInstanceFieldErrors(fieldBindings, validation) {
  Object.keys(fieldBindings).forEach((field) => {
    const binding = fieldBindings[field];
    const message = getFieldValidationMessage(validation, field);
    setControlError(binding.controlEl, binding.errorEl, message);
  });
}

function clearMultiInstanceFieldErrors(fieldBindings) {
  setMultiInstanceFieldErrors(fieldBindings, null);
}

export default class MultiInstanceComponent {
  constructor(entry) {
    this.entry = entry;
    this.state = createState(entry);
  }

  mount(mountEl) {
    const entry = this.entry;
    let state = this.state;

    renderHtml(mountEl, editorUI(state));

    const editorEl = mountEl.querySelector('[data-editor-kind="multi-instance"]');
    const fieldsEl = editorEl.querySelector('.layui-bpmn-panel__multi-instance-fields');
    const enabledField = getBindingFieldEls(editorEl, 'enabled');
    const isSequentialField = getBindingFieldEls(editorEl, 'isSequential');
    const assigneeModeField = getBindingFieldEls(editorEl, 'assigneeMode');
    const collectionField = getBindingFieldEls(editorEl, 'collection');
    const elementVariableField = getBindingFieldEls(editorEl, 'elementVariable');
    const idsField = getBindingFieldEls(editorEl, 'ids');
    const namesField = getBindingFieldEls(editorEl, 'names');
    const loopCardinalityField = getBindingFieldEls(editorEl, 'loopCardinality');
    const completionConditionField = getBindingFieldEls(editorEl, 'completionCondition');

    const enabledInputEl = enabledField.controlEl;
    const isSequentialInputEl = isSequentialField.controlEl;
    const assigneeModeSelectEl = assigneeModeField.controlEl;
    const pickUsersButtonEl = idsField.fieldEl.querySelector('[data-action="pick-users"]');
    const clearUsersButtonEl = idsField.fieldEl.querySelector('[data-action="clear-users"]');
    const collectionInputEl = collectionField.controlEl;
    const elementVariableInputEl = elementVariableField.controlEl;
    const loopCardinalityInputEl = loopCardinalityField.controlEl;
    const completionConditionEl = completionConditionField.controlEl;
    const namesPreviewEl = namesField.controlEl;

    enabledInputEl.checked = !!state.enabled;
    isSequentialInputEl.checked = !!state.isSequential;
    assigneeModeSelectEl.value = state.assigneeMode;
    collectionInputEl.value = state.collection;
    elementVariableInputEl.value = state.elementVariable;
    loopCardinalityInputEl.value = state.loopCardinality;
    completionConditionEl.value = state.completionCondition;

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

    const syncComponentValue = () => {
      this.state = state;
    };

    function syncNamesPreview() {
      renderPreviewValue(namesPreviewEl, state.names);
    }

    function syncUserButtonsState() {
      const count = getMultiInstanceSelectedNames(state.names).length;
      const isUserMode = state.assigneeMode === 'user';
      const disabled = !state.enabled;

      pickUsersButtonEl.disabled = disabled;
      clearUsersButtonEl.disabled = disabled || !isUserMode || count === 0;
      clearUsersButtonEl.hidden = !isUserMode;
    }

    function syncAssigneeModeFields() {
      const isUserMode = state.assigneeMode === 'user';

      idsField.fieldEl.hidden = !isUserMode;
      namesField.fieldEl.hidden = !isUserMode;
    }

    function syncFieldAvailability() {
      const disabled = !state.enabled;

      setControlDisabled(isSequentialField, disabled);
      setControlDisabled(assigneeModeField, disabled);
      setControlDisabled(idsField, disabled || state.assigneeMode !== 'user');
      setControlDisabled(namesField, disabled || state.assigneeMode !== 'user');
      setControlDisabled(collectionField, disabled);
      setControlDisabled(elementVariableField, disabled);
      setControlDisabled(loopCardinalityField, disabled);
      setControlDisabled(completionConditionField, disabled);
      syncUserButtonsState();
    }

    function submitValue(value, options = {}) {
      const validation = options.skipValidation ? { valid: true } : entry.validate(value);

      if (!options.skipValidation) {
        setMultiInstanceFieldErrors(fieldBindings, validation);
      }

      if (validation && validation.valid === false) {
        return {updated: false, validation};
      }

      const result = entry.setValue(value);
      setMultiInstanceFieldErrors(fieldBindings, result && result.validation);

      if (result && result.updated === true) {
        state = createMultiInstanceProperties(value);
        syncComponentValue();
      }

      return result;
    }

    function bindCommitOnBlur(controlEl, onReadValue) {
      function commitValue() {
        if (!state.enabled) {
          return;
        }

        const nextValue = { ...state, ...onReadValue() };
        const result = submitValue(nextValue);
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

    syncNamesPreview();
    syncUserButtonsState();
    syncAssigneeModeFields();
    syncFieldAvailability();

    enabledInputEl.addEventListener('change', () => {
      if (!!enabledInputEl.checked === !!state.enabled) {
        syncFieldAvailability();
        return;
      }

      const lastValue = { ...state };
      const nextValue = {...state, enabled: !!enabledInputEl.checked};

      state = createMultiInstanceProperties(nextValue);
      syncComponentValue();
      syncFieldAvailability();

      const result = nextValue.enabled ? submitValue(nextValue) : submitValue(nextValue, { skipValidation: true });
      if (result && result.updated === true) {
        clearMultiInstanceFieldErrors(fieldBindings);
        syncFieldAvailability();
        return;
      }

      if (!nextValue.enabled) {
        state = createMultiInstanceProperties(lastValue);
        enabledInputEl.checked = !!state.enabled;
        syncComponentValue();
        syncFieldAvailability();
      }
    });

    isSequentialInputEl.addEventListener('change', () => {
      state.isSequential = !!isSequentialInputEl.checked;
      syncComponentValue();

      if (state.enabled) {
        submitValue({...state});
      }
    });

    assigneeModeSelectEl.addEventListener('change', () => {
      let nextValue = assigneeModeSelectEl.value;

      state.assigneeMode = toStr(nextValue).trim();
      assigneeModeSelectEl.value = state.assigneeMode;

      if (state.assigneeMode !== 'user') {
        state.ids = '';
        state.names = '';
      }

      syncComponentValue();
      syncNamesPreview();
      syncUserButtonsState();
      syncAssigneeModeFields();
      syncFieldAvailability();

      if (!state.enabled) {
        return;
      }

      if (state.assigneeMode === 'user' && !toStr(state.ids).trim()) {
        clearMultiInstanceFieldErrors(fieldBindings);
        return;
      }

      submitValue({...state});
    });

    clearUsersButtonEl.addEventListener('click', () => {
      if (!state.enabled || state.assigneeMode !== 'user') {
        return;
      }

      state.ids = '';
      state.names = '';
      syncComponentValue();

      syncNamesPreview();
      syncUserButtonsState();

      submitValue({...state});
    });

    pickUsersButtonEl.addEventListener('click', async () => {
      if (!state.enabled || typeof entry.pickUsers !== 'function') {
        return;
      }

      let pickedUsers = null;
      try {
        pickedUsers = await entry.pickUsers({ ...state });
      } catch (error) {
        return;
      }

      if (!Array.isArray(pickedUsers)) {
        return;
      }

      state = applyPickedUsersToValue(state, pickedUsers);
      syncComponentValue();

      assigneeModeSelectEl.value = state.assigneeMode;
      syncNamesPreview();
      syncUserButtonsState();
      syncAssigneeModeFields();
      syncFieldAvailability();

      submitValue({...state});
    });

    collectionInputEl.addEventListener('input', () => {
      state.collection = toStr(collectionInputEl.value);
      syncComponentValue();

      if (state.enabled) {
        submitValue({...state});
      }
    });

    elementVariableInputEl.addEventListener('input', () => {
      state.elementVariable = toStr(elementVariableInputEl.value);
      syncComponentValue();

      if (state.enabled) {
        submitValue({...state});
      }
    });

    loopCardinalityInputEl.addEventListener('input', () => {
      state.loopCardinality = toStr(loopCardinalityInputEl.value);
      syncComponentValue();

      if (state.enabled) {
        submitValue({...state});
      }
    });

    completionConditionEl.addEventListener('input', () => {
      state.completionCondition = toStr(completionConditionEl.value);
      syncComponentValue();

      if (state.enabled) {
        submitValue({...state});
      }
    });

    bindCommitOnBlur(collectionInputEl, () => ({
      collection: toStr(collectionInputEl.value)
    }));
    bindCommitOnBlur(elementVariableInputEl, () => ({
      elementVariable: toStr(elementVariableInputEl.value)
    }));
    bindCommitOnBlur(loopCardinalityInputEl, () => ({
      loopCardinality: toStr(loopCardinalityInputEl.value)
    }));
    completionConditionEl.addEventListener('blur', () => {
      if (state.enabled) {
        submitValue({...state, completionCondition: toStr(completionConditionEl.value)});
      }
    });

    return {
      editorEl,
      fieldsEl
    };
  }
}

export function createEntry(entry, group, element, options) {
  writer.bindMultiInstanceEntry(entry, group, element, options);

  return new MultiInstanceComponent(entry);
}
