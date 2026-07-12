import {toStr} from '../../common/utils.js';
import {escapeAttr, renderHtml} from '../../common/html.js';
import {getFieldValidationMessage, setControlError} from "../../common/errors";
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

function itemsUI(items) {
  if (!items.length) {
    return '<div class="layui-bpmn-panel__entry-preview layui-bpmn-panel__entry-preview--empty">-</div>';
  }

  return items.map((item, index) => {
    const indexText = String(index);

    return `
      <div class="layui-bpmn-panel__listener-item" data-listener-index="${escapeAttr(indexText)}">
        <div class="layui-bpmn-panel__listener-item-body">
        
        <div class="layui-form-item layui-bpmn-panel__listener-field" data-field="event">
          <label class="layui-form-label layui-bpmn-panel__entry-label">事件</label>
          <div class="layui-input-block layui-bpmn-panel__listener-field-mount">
            <select class="layui-input layui-bpmn-panel__listener-select" data-field="event" lay-ignore>
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
            <select class="layui-input layui-bpmn-panel__listener-select" data-field="type" lay-ignore>
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

function setListenerFieldErrors(fieldBindings, validation) {
  Object.keys(fieldBindings).forEach((field) => {
    const binding = fieldBindings[field];
    const message = getFieldValidationMessage(validation, field);
    setControlError(binding.controlEl, binding.errorEl, message);
  });
}

function createListenerProperties(item = {}) {
  return {
    event: toStr(item.event).trim() || 'assignment',
    type: toStr(item.type).trim() || 'expression',
    value: toStr(item.value)
  };
}

function createListenerValue(value) {
  const items = value && Array.isArray(value.items) ? value.items : [];

  return {
    items: items.map((item) => createListenerProperties(item))
  };
}

function syncListenerItems(state, value) {
  const newState = createListenerValue(value);

  state.items = newState.items;

  return state;
}


export default class ListenersComponent {
  constructor(entry) {
    this.entry = entry;
    this.state = createListenerValue(entry.getValue());
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

      renderHtml(itemsEl, itemsUI(state.items));

      if (!state.items.length) {
        return;
      }

      itemsEl.querySelectorAll('.layui-bpmn-panel__listener-item').forEach((itemEl) => {
        const index = Number(itemEl.getAttribute('data-listener-index'));
        const item = state.items[index];
        const value = createListenerProperties(item);
        let lastValue = JSON.stringify(value);

        const eventField = getBindingFieldEls(itemEl, 'event');
        const typeField = getBindingFieldEls(itemEl, 'type');
        const valueField = getBindingFieldEls(itemEl, 'value');
        const deleteButtonEl = itemEl.querySelector('[data-action="remove-listener"]');
        const fieldBindings = {
          event: eventField,
          type: typeField,
          value: valueField
        };

        eventField.controlEl.value = value.event;
        typeField.controlEl.value = value.type;
        valueField.controlEl.value = value.value;

        function submitData() {
          const newValue = createListenerProperties({
            event: eventField.controlEl.value,
            type: typeField.controlEl.value,
            value: valueField.controlEl.value
          });
          const nextValue = JSON.stringify(newValue);
          if (nextValue === lastValue) {
            return;
          }

          const validation = typeof entry.validate === 'function' ? entry.validate(newValue) : null;
          setListenerFieldErrors(fieldBindings, validation);
          if (validation && validation.valid === false) {
            return;
          }

          const result = entry.setValue({action: 'update', index, value: newValue});
          if (!result || !result.updated) {
            return;
          }

          lastValue = nextValue;
          state.items[index] = newValue;

          if (result.value) {
            syncListenerItems(state, result.value);
            renderItems();
          }
        }

        eventField.controlEl.addEventListener('change', submitData);
        typeField.controlEl.addEventListener('change', submitData);
        valueField.controlEl.addEventListener('blur', submitData);
        valueField.controlEl.addEventListener('keydown', (event) => {
          if (event && event.key === 'Enter') {
            if (typeof event.preventDefault === 'function') {
              event.preventDefault();
            }

            submitData();
          }
        });

        deleteButtonEl.addEventListener('click', () => {
          const result = entry.setValue({action: 'remove', index});
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
      const result = entry.setValue({ action: 'add' });
      if (!result || !result.updated) {
        return;
      }

      if (result.value) {
        syncListenerItems(state, result.value);
      } else {
        state.items.push(createListenerProperties());
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
