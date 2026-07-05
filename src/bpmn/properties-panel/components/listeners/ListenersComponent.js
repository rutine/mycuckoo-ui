import {toStr} from '../../common/utils.js';
import {escapeAttr, renderHtml} from '../../common/html.js';
import {getFieldValidationMessage, setControlError} from "../../common/errors";
import {
  createListenerDraft,
  createListenerValue,
  getEntryValue,
  LAYUI_SELECT_BINDING_PROP,
  LAYUI_SELECT_FILTER_PROP,
  syncListenerItems
} from './ListenersState.js';
import writer from './ListenersWriter.js';


function editorUI() {
  return `
    <div class="layui-bpmn-panel__listener-editor" data-editor-kind="listener-editor">
    <div class="layui-bpmn-panel__listener-items"></div>
    <div class="layui-bpmn-panel__listener-actions">
    <button type="button" class="layui-btn layui-btn-sm" data-action="add-listener">新增监听器</button>
    </div>
    </div>
  `;
}

function itemsUI(items, selectMode) {
  if (!items.length) {
    return '<div class="layui-bpmn-panel__entry-preview layui-bpmn-panel__entry-preview--empty">-</div>';
  }

  return items.map((item, index) => {
    const indexText = String(index);
    const selectMode1 = (selectMode || 'native') === 'layui' ? `lay-filter="listener-event-${index}` : 'lay-ignore';
    const selectMode2 = (selectMode || 'native') === 'layui' ? `lay-filter="listener-type-${index}` : 'lay-ignore';

    return `
      <div class="layui-bpmn-panel__listener-item" data-listener-index="${escapeAttr(indexText)}">
        <div class="layui-bpmn-panel__listener-item-body">
        
        <div class="layui-form-item layui-bpmn-panel__listener-field" data-field="event">
          <label class="layui-form-label layui-bpmn-panel__entry-label">事件</label>
          <div class="layui-input-block layui-bpmn-panel__listener-field-mount">
            <select class="layui-input layui-bpmn-panel__listener-select" data-field="event" ${selectMode1}>
              <option value="assignment">任务分派事件</option>
              <option value="create">创建事件</option>
              <option value="complete">完成事件</option>
              <option value="delete">删除事件</option>
              <option value="all">所有事件</option>
            </select>
            <div class="layui-bpmn-panel__entry-error"></div>
          </div>
        </div>

        <div class="layui-form-item layui-bpmn-panel__listener-field" data-field="type">
          <label class="layui-form-label layui-bpmn-panel__entry-label">监听器类型</label>
          <div class="layui-input-block layui-bpmn-panel__listener-field-mount">
            <select class="layui-input layui-bpmn-panel__listener-select" data-field="type" ${selectMode2}>
              <option value="expression">表达式</option>
              <option value="class">类</option>
              <option value="delegateExpression">代理表达式</option>
            </select>
            <div class="layui-bpmn-panel__entry-error"></div>
          </div>
        </div>

        <div class="layui-form-item layui-bpmn-panel__listener-field" data-field="value">
          <label class="layui-form-label layui-bpmn-panel__entry-label">值</label>
          <div class="layui-input-block layui-bpmn-panel__listener-field-mount">
            <input type="text" class="layui-input" data-field="value">
            <div class="layui-bpmn-panel__entry-error"></div>
          </div>
        </div>
        
        <button type="button" class="layui-btn layui-btn-sm layui-btn-primary" data-action="remove-listener">删除监听器</button>
        </div>
      </div>
    `
  });
}

function setSelectMode(selectEl, options = {}) {
  const selectMode = options.selectMode || 'native';
  if (selectMode === 'layui') {
    selectEl[LAYUI_SELECT_FILTER_PROP] = options.layFilter || '';
  }

  if (typeof selectEl.setAttribute !== 'function') {
    return;
  }

  if (selectMode === 'layui' && options.layFilter) {
    selectEl.setAttribute('lay-filter', options.layFilter);
  } else {
    selectEl.setAttribute('lay-ignore', '');
  }
}

function focusControl(controlEl) {
  if (!controlEl) {
    return;
  }

  if (typeof controlEl.focus === 'function') {
    controlEl.focus();
  }
  if (toStr(controlEl.value) && typeof controlEl.select === 'function') {
    controlEl.select();
  }
}

function createState(entry) {
  return createListenerValue(getEntryValue(entry));
}

function getBindingFieldEls(itemEl, field) {
  const fieldEl = itemEl.querySelector(`.layui-bpmn-panel__listener-field[data-field="${field}"]`);
  const controlEl = fieldEl.querySelector(`[data-field="${field}"]`);
  const errorEl = fieldEl.querySelector('.layui-bpmn-panel__entry-error');

  return {
    fieldEl,
    controlEl,
    errorEl
  };
}

function setLayuiSelectBinding(selectEl, onChange) {
  if (!selectEl || typeof onChange !== 'function') {
    return;
  }

  const layFilter = typeof selectEl.getAttribute === 'function'
      ? toStr(selectEl.getAttribute('lay-filter')).trim()
      : toStr(selectEl[LAYUI_SELECT_FILTER_PROP]).trim();

  if (!layFilter) {
    return;
  }

  selectEl[LAYUI_SELECT_BINDING_PROP] = {
    element: selectEl,
    filter: layFilter,
    onChange
  };
}

function setListenerFieldErrors(fieldBindings, validation) {
  Object.keys(fieldBindings).forEach((field) => {
    const binding = fieldBindings[field];
    const message = getFieldValidationMessage(validation, field);
    setControlError(binding.controlEl, binding.errorEl, message);
  });
}

export default class ListenersComponent {
  constructor(entry) {
    this.entry = entry;
    this.state = createState(entry);
  }

  mount(mountEl) {
    const entry = this.entry;
    const state = this.state;

    renderHtml(mountEl, editorUI());

    const editorEl = mountEl.querySelector('[data-editor-kind="listener-editor"]');
    const itemsEl = editorEl.querySelector('.layui-bpmn-panel__listener-items');
    const actionsEl = editorEl.querySelector('.layui-bpmn-panel__listener-actions');

    function renderItems(options = {}) {
      const focusIndex = Number.isInteger(options.focusIndex) ? options.focusIndex : -1;
      const selectMode = entry.ui && entry.ui.selectMode === 'native' ? 'native' : 'layui';

      renderHtml(itemsEl, itemsUI(state.items, selectMode));

      if (!state.items.length) {
        return;
      }

      itemsEl.querySelectorAll('.layui-bpmn-panel__listener-item').forEach((itemEl) => {
        const index = Number(itemEl.getAttribute('data-listener-index'));
        const item = state.items[index];
        const draft = createListenerDraft(item);
        let lastDraft = JSON.stringify(draft);

        const eventField = getBindingFieldEls(itemEl, 'event');
        const typeField = getBindingFieldEls(itemEl, 'type');
        const valueField = getBindingFieldEls(itemEl, 'value');
        const deleteButtonEl = itemEl.querySelector('[data-action="remove-listener"]');
        const fieldBindings = {
          event: eventField,
          type: typeField,
          value: valueField
        };

        setSelectMode(eventField.controlEl, {selectMode: selectMode, layFilter: `listener-event-${index}`});
        setSelectMode(typeField.controlEl, {selectMode: selectMode, layFilter: `listener-type-${index}`});

        eventField.controlEl.value = draft.event;
        typeField.controlEl.value = draft.type;
        valueField.controlEl.value = draft.value;

        function submitDraft() {
          const newDraft = createListenerDraft({
            event: eventField.controlEl.value,
            type: typeField.controlEl.value,
            value: valueField.controlEl.value
          });
          const nextDraft = JSON.stringify(newDraft);
          if (nextDraft === lastDraft) {
            return;
          }

          const validation = typeof entry.validate === 'function' ? entry.validate(newDraft) : null;
          setListenerFieldErrors(fieldBindings, validation);
          if (validation && validation.valid === false) {
            return;
          }

          const result = typeof entry.setValue === 'function'
            ? entry.setValue({action: 'update', index, draft: newDraft})
            : { updated: false };
          const resultValidation = result && result.validation ? result.validation : null;
          setListenerFieldErrors(fieldBindings, resultValidation);
          if (!result || !result.updated) {
            return;
          }

          lastDraft = nextDraft;
          state.items[index] = newDraft;

          if (result.value) {
            syncListenerItems(state, result.value);
            renderItems();
          }
        }

        setLayuiSelectBinding(eventField.controlEl, (nextValue) => {
          eventField.controlEl.value = toStr(nextValue);
          submitDraft();
        });
        setLayuiSelectBinding(typeField.controlEl, (nextValue) => {
          typeField.controlEl.value = toStr(nextValue);
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
          const result = typeof entry.setValue === 'function' ? entry.setValue({action: 'remove', index}) : { updated: false };
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

        if (index === focusIndex) {
          focusControl(valueField.controlEl);
        }
      });
    }

    const addButtonEl = actionsEl.querySelector('[data-action="add-listener"]');
    addButtonEl.addEventListener('click', () => {
      const result = typeof entry.setValue === 'function' ? entry.setValue({ action: 'add' }) : { updated: false };
      if (!result || !result.updated) {
        return;
      }

      if (result.value) {
        syncListenerItems(state, result.value);
      } else {
        state.items.push(createListenerDraft());
      }

      renderItems({focusIndex: state.items.length - 1});
    });

    renderItems();

    return {editorEl, itemsEl, actionsEl};
  }
}

export function createEntry(entry, group, element, options) {
  writer.bindListenerEntry(entry, group, element, options);

  return new ListenersComponent(entry);
}
