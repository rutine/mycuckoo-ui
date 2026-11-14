import {toStr} from '../../common/utils.js';
import {firstValidationMessage, setControlError} from '../../common/errors.js';
import {escapeAttr, escapeHtml, renderHtml} from '../../common/html.js';
import writer from './BasicWriter.js';


function ui(entry) {
  if (!entry) {
    return `<input type="text" class="layui-input" data-basic-control="true" data-entry-key="" data-component="">
        <div class="layui-bpmn-panel__entry-error"></div>`;
  }

  const key = escapeAttr(entry.key || '');
  const component = escapeAttr(entry.component || '');
  const datasetAttributes = `data-basic-control="true" data-entry-key="${key}" data-component="${component}"`;

  if (entry.component === 'Switch') {
    return `<input type="checkbox" class="" ${datasetAttributes} lay-skin="switch" lay-text="${escapeAttr(entry.layText || '是|否')}">
        <div class="layui-bpmn-panel__entry-error"></div>`;
  }
  else if (entry.component === 'Select') {
    return `
        <select class="layui-input" ${datasetAttributes} lay-ignore>
        ${(entry.options || []).map((option) => {
          const value = toStr(option && option.value);
          const label = toStr(option && option.label) || value;
          return `<option value="${escapeAttr(value)}">${escapeHtml(label)}</option>`;
        }).join('')}
        </select>
        <div class="layui-bpmn-panel__entry-error"></div>
    `;
  }
  else if (entry.component === 'Picker') {
    return `
        <div class="layui-input-wrap">
          <input type="text" class="layui-input" ${datasetAttributes} readonly>
          <div class="layui-input-affix layui-input-suffix" style="width: 70px">
            <i class="layui-icon layui-font-blue layui-icon-search" data-action="choose"></i> 
            <i class="layui-icon layui-font-red layui-icon-clear" data-action="clear"></i>
          </div>
        </div>
        <div class="layui-bpmn-panel__entry-error"></div>
    `;
  }
  else if (entry.component === 'ExpressionEditor') {
    return `<textarea class="layui-textarea" ${datasetAttributes}></textarea>
            <div class="layui-bpmn-panel__entry-error"></div>`;
  }

  return `<input type="text" class="layui-input" ${datasetAttributes}>
          <div class="layui-bpmn-panel__entry-error"></div>`;
}

function setControlValue(controlEl, entry, value) {
  if (!controlEl) {
    return;
  }

  if (entry && entry.component === 'Switch') {
    controlEl.checked = toStr(value) === 'true';
    return;
  }

  if (entry && entry.component === 'Picker') {
    const rawValue = toStr(value);
    const text = rawValue && typeof entry.getText === 'function' ? toStr(entry.getText()) : '';

    controlEl.dataset.value = rawValue;
    controlEl.value = text || rawValue;
    controlEl.placeholder = entry.emptyText || '';
    return;
  }

  controlEl.value = toStr(value);
}


export function isBasicEntry(entry) {
  return !!(entry && (entry.component === 'TextInput'
      || entry.component === 'ExpressionEditor'
      || entry.component === 'Picker'
      || entry.component === 'Select'
      || entry.component === 'Switch'
  ));
}

export default class BasicComponent {
  constructor(entry) {
    this.entry = entry;
  }

  bindEvents(controlEl, errorEl, initialValue) {
    const entry = this.entry;
    let lastValue = entry.component === 'Switch'
        ? (toStr(initialValue) === 'true' ? 'true' : 'false')
        : toStr(initialValue);


    function submitValue() {
      const newValue = entry.component === 'Switch' ? !!controlEl.checked : toStr(controlEl.value);
      const nextValue = entry.component === 'Switch' ? String(newValue) : newValue;
      if (nextValue === lastValue) {
        return;
      }

      const validation = typeof entry.validate === 'function' ? entry.validate(newValue) : null;
      const validationMessage = firstValidationMessage(validation);
      if (validationMessage) {
        setControlError(controlEl, errorEl, validationMessage);
        return;
      }

      const result = typeof entry.setValue === 'function' ? entry.setValue(newValue) : { updated: false };
      const resultMessage = firstValidationMessage(result && result.validation);
      setControlError(controlEl, errorEl, resultMessage);

      if (result && result.updated) {
        lastValue = nextValue;
      }
    }

    function submitPicker(data) {
      const nextValue = toStr(data && data.id);
      const nextText = toStr(data && data.name);
      const currentText = typeof entry.getText === 'function' ? toStr(entry.getText()) : '';
      if (nextValue === lastValue && nextText === currentText) {
        return false;
      }

      const validation = typeof entry.validate === 'function' ? entry.validate(nextValue) : null;
      const validationMessage = firstValidationMessage(validation);
      if (validationMessage) {
        setControlError(controlEl, errorEl, validationMessage);
        return false;
      }

      const result = typeof entry.setValue === 'function' ? entry.setValue(data) : {updated: false};
      const resultMessage = firstValidationMessage(result && result.validation);
      setControlError(controlEl, errorEl, resultMessage);

      if (result && result.updated) {
        lastValue = nextValue;
        return true;
      }

      return false;
    }

    if (entry.component !== 'Picker') {
      controlEl.addEventListener('blur', submitValue);
      controlEl.addEventListener('change', submitValue);
      controlEl.addEventListener('keydown', (event) => {
        if (String(controlEl.tagName || '').toLowerCase() === 'input' && event && event.key === 'Enter') {
          if (typeof event.preventDefault === 'function') {
            event.preventDefault();
          }

          submitValue();
        }
      });
    }

    return {
      submitPicker
    };
  }

  mount(mountEl) {
    let value = typeof this.entry.getValue === 'function' ? this.entry.getValue() : null;

    renderHtml(mountEl, ui(this.entry));

    const controlEl = mountEl.querySelector('[data-basic-control="true"]');
    const errorEl = mountEl.querySelector('.layui-bpmn-panel__entry-error');

    setControlValue(controlEl, this.entry, value);
    const binding = this.bindEvents(controlEl, errorEl, value);

    if (this.entry.component === 'Picker') {
      const entry = this.entry;
      const chooseEl = mountEl.querySelector('[data-action="choose"]');
      const clearEl = mountEl.querySelector('[data-action="clear"]');

      chooseEl.addEventListener('click', function() {
        if (typeof entry.pickValue !== 'function') {
          return;
        }

        const currentValue = toStr(controlEl.dataset.value);
        Promise.resolve(entry.pickValue({
          element: null,
          value: {ids: currentValue, names: controlEl.value},
          entryKey: entry.key || null
        })).then(function(selected) {
          if (!selected || !toStr(selected.id)) {
            return;
          }

          const nextValue = toStr(selected.id);
          controlEl.dataset.value = nextValue;
          controlEl.value = toStr(selected.name) || nextValue;
          binding.submitPicker(selected);
        }).catch(function(error) {
          console.error('选择表单失败', error);
        });
      });

      clearEl.addEventListener('click', function() {
        controlEl.dataset.value = '';
        controlEl.value = '';
        controlEl.placeholder = entry.emptyText || '';
        binding.submitPicker({id: '', name: ''});
      });
    }

    return {
      controlEl,
      errorEl
    };
  }
}

export function createEntry(entry, group, element, options) {
  writer.bindBasicEntries(entry, group, element, options);

  return new BasicComponent(entry);
}
