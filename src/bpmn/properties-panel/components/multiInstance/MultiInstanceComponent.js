import {toggleClassName, toStr} from '../../common/utils.js';
import {escapeHtml, renderHtml} from '../../common/html.js';
import {getFieldValidationMessage, setControlError} from "../../common/errors";

import {
  applyPickedUsersToDraft,
  createMultiInstanceProperties,
  createState,
  getMultiInstanceSelectedNames
} from './MultiInstanceState.js';
import writer from './MultiInstanceWriter.js';


function applySelectMode(selectEl, options = {}) {
  const selectMode = options.selectMode || 'native';
  if (typeof selectEl.setAttribute !== 'function') {
    return;
  }

  if (selectMode === 'layui' && options.layFilter) {
    selectEl.setAttribute('lay-filter', options.layFilter);
  } else {
    selectEl.setAttribute('lay-ignore', '');
  }
}

function previewUI(value) {
  const names = getMultiInstanceSelectedNames(value);

  if (!names.length) {
    return '暂未选择用户';
  }

  return names.map((name) =>
      `<span class="layui-bpmn-panel__multi-instance-tag layui-badge-rim">${escapeHtml(name)}</span>`
  ).join('');
}

function editorUI(draft) {
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
          ${previewUI(draft.names)}
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
    this.draft = createState(entry);
  }

  mount(mountEl) {
    const entry = this.entry;
    let draft = this.draft;

    renderHtml(mountEl, editorUI(draft));

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

    enabledInputEl.checked = !!draft.enabled;
    isSequentialInputEl.checked = !!draft.isSequential;
    assigneeModeSelectEl.value = draft.assigneeMode;
    applySelectMode(assigneeModeSelectEl, { selectMode: 'native' });
    collectionInputEl.value = draft.collection;
    elementVariableInputEl.value = draft.elementVariable;
    loopCardinalityInputEl.value = draft.loopCardinality;
    completionConditionEl.value = draft.completionCondition;

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

    const syncComponentDraft = () => {
      this.draft = draft;
    };

    function syncNamesPreview() {
      renderPreviewValue(namesPreviewEl, draft.names);
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

      setControlDisabled(isSequentialField, disabled);
      setControlDisabled(assigneeModeField, disabled);
      setControlDisabled(idsField, disabled || draft.assigneeMode !== 'user');
      setControlDisabled(namesField, disabled || draft.assigneeMode !== 'user');
      setControlDisabled(collectionField, disabled);
      setControlDisabled(elementVariableField, disabled);
      setControlDisabled(loopCardinalityField, disabled);
      setControlDisabled(completionConditionField, disabled);
      syncUserButtonsState();
    }

    function submitDraft(nextDraft, options = {}) {
      const validation = options.skipValidation
        ? { valid: true }
        : (typeof entry.validate === 'function' ? entry.validate(nextDraft) : { valid: true });

      if (!options.skipValidation) {
        setMultiInstanceFieldErrors(fieldBindings, validation);
      }

      if (validation && validation.valid === false) {
        return {updated: false, validation};
      }

      const result = typeof entry.setValue === 'function' ? entry.setValue(nextDraft) : { updated: false };
      setMultiInstanceFieldErrors(fieldBindings, result && result.validation);

      if (result && result.updated === true) {
        draft = createMultiInstanceProperties(nextDraft);
        syncComponentDraft();
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

        const result = submitDraft(nextDraft);
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
      if (!!enabledInputEl.checked === !!draft.enabled) {
        syncFieldAvailability();
        return;
      }

      const lastDraft = { ...draft };
      const nextDraft = {...draft, enabled: !!enabledInputEl.checked};

      draft = createMultiInstanceProperties(nextDraft);
      syncComponentDraft();
      syncFieldAvailability();

      const result = nextDraft.enabled ? submitDraft(nextDraft) : submitDraft(nextDraft, { skipValidation: true });
      if (result && result.updated === true) {
        clearMultiInstanceFieldErrors(fieldBindings);
        syncFieldAvailability();
        return;
      }

      if (!nextDraft.enabled) {
        draft = createMultiInstanceProperties(lastDraft);
        enabledInputEl.checked = !!draft.enabled;
        syncComponentDraft();
        syncFieldAvailability();
      }
    });

    isSequentialInputEl.addEventListener('change', () => {
      draft.isSequential = !!isSequentialInputEl.checked;
      syncComponentDraft();

      if (draft.enabled) {
        submitDraft({...draft});
      }
    });

    assigneeModeSelectEl.addEventListener('change', () => {
      let nextValue = assigneeModeSelectEl.value;

      draft.assigneeMode = toStr(nextValue).trim();
      assigneeModeSelectEl.value = draft.assigneeMode;

      if (draft.assigneeMode !== 'user') {
        draft.ids = '';
        draft.names = '';
      }

      syncComponentDraft();
      syncNamesPreview();
      syncUserButtonsState();
      syncAssigneeModeFields();
      syncFieldAvailability();

      if (!draft.enabled) {
        return;
      }

      if (draft.assigneeMode === 'user' && !toStr(draft.ids).trim()) {
        clearMultiInstanceFieldErrors(fieldBindings);
        return;
      }

      submitDraft({...draft});
    });

    clearUsersButtonEl.addEventListener('click', () => {
      if (!draft.enabled || draft.assigneeMode !== 'user') {
        return;
      }

      draft.ids = '';
      draft.names = '';
      syncComponentDraft();

      syncNamesPreview();
      syncUserButtonsState();

      submitDraft({...draft});
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

      draft = applyPickedUsersToDraft(draft, pickedUsers);
      syncComponentDraft();

      assigneeModeSelectEl.value = draft.assigneeMode;
      syncNamesPreview();
      syncUserButtonsState();
      syncAssigneeModeFields();
      syncFieldAvailability();

      submitDraft({...draft});
    });

    collectionInputEl.addEventListener('input', () => {
      draft.collection = toStr(collectionInputEl.value);
      syncComponentDraft();

      if (draft.enabled) {
        submitDraft({...draft});
      }
    });

    elementVariableInputEl.addEventListener('input', () => {
      draft.elementVariable = toStr(elementVariableInputEl.value);
      syncComponentDraft();

      if (draft.enabled) {
        submitDraft({...draft});
      }
    });

    loopCardinalityInputEl.addEventListener('input', () => {
      draft.loopCardinality = toStr(loopCardinalityInputEl.value);
      syncComponentDraft();

      if (draft.enabled) {
        submitDraft({...draft});
      }
    });

    completionConditionEl.addEventListener('input', () => {
      draft.completionCondition = toStr(completionConditionEl.value);
      syncComponentDraft();

      if (draft.enabled) {
        submitDraft({...draft});
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
      if (!draft.enabled) {
        return;
      }

      submitDraft({...draft, completionCondition: toStr(completionConditionEl.value)});
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
