import { toStr } from '../../common/utils.js';
import {
  escapeHtml,
  renderHtml
} from '../../common/html.js';
import writer from './ParametersWriter.js';


function getItems(value) {
  return value && Array.isArray(value.items) ? value.items : [];
}

function linePreviewUI(text, modifierClass = '') {
  const className = `layui-bpmn-panel__entry-preview${modifierClass ? ` ${modifierClass}` : ''}`;

  return `<div class="${className}">${escapeHtml(text)}</div>`;
}

function emptyPreviewUI() {
  return linePreviewUI('-', 'layui-bpmn-panel__entry-preview--empty');
}

function parameterPreviewUI(value) {
  const items = getItems(value);
  if (!items.length) {
    return emptyPreviewUI();
  }

  return items.map((item) => {
    const name = toStr(item && item.name).trim() || '(unnamed)';
    const parameterValue = toStr(item && item.value);

    return linePreviewUI(`${name} = ${parameterValue}`);
  }).join('');
}

function extensionPreviewUI(value) {
  const items = getItems(value);

  if (!items.length) {
    return emptyPreviewUI();
  }

  return items.map((item) => {
    const parameterName = toStr(item && item.parameterName).trim() || '(parameter)';
    const key = toStr(item && item.key).trim() || '(key)';

    return linePreviewUI(`${parameterName}.${key}`);
  }).join('');
}

export function isParametersEntry(entry) {
  return !!(entry && (
    entry.component === 'ParameterEditor' ||
    entry.component === 'ExtensionEditor'
  ));
}

export default class ParametersComponent {
  constructor(entry) {
    this.entry = entry;
  }

  mount(mountEl) {
    const value = this.entry.getValue();

    if (this.entry && this.entry.component === 'ExtensionEditor') {
      renderHtml(mountEl, extensionPreviewUI(value));
      return {
        previewKind: 'extension'
      };
    }

    renderHtml(mountEl, parameterPreviewUI(value));

    return {
      previewKind: 'parameter'
    };
  }
}

export function createEntry(entry, group, element, options) {
  writer.bindParameterEntry(entry, group, element, options);
  writer.bindExtensionEntry(entry, group, element, options);

  return new ParametersComponent(entry);
}
