import {escapeAttr, escapeHtml, htmlToElement} from '../common/html.js';
import {toStr} from '../common/utils.js';

import basicComponent from "../components/basic";
import flowConditionComponent from "../components/flowCondition";
import listenersComponent from "../components/listeners";
import multiInstanceComponent from "../components/multiInstance";
import parametersComponent from "../components/parameters";


const LAYUI_SELECT_BINDING_PROP = '__layuiSelectBinding';

const entryComponents = [
  basicComponent,
  flowConditionComponent,
  listenersComponent,
  multiInstanceComponent,
  parametersComponent
];

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

function isEmbeddedEntryComponent(component) {
  return !!(component && component.entryLayout === 'embedded');
}

function renderEntryPreviewHtml(entry) {
  const text = toStr(readEntryValue(entry)).trim();
  const modifierClass = text ? '' : ' layui-bpmn-panel__entry-preview--empty';

  return `<div class="layui-bpmn-panel__entry-preview${modifierClass}">${escapeHtml(text || '-')}</div>`;
}

function renderEntryHtml(group, entry, index) {
  const componentDefinition = resolveEntryComponent(entry);
  const embedded = isEmbeddedEntryComponent(componentDefinition);
  const entryClassName = `layui-form-item layui-bpmn-panel__entry${embedded ? ' layui-bpmn-panel__entry--embedded' : ''}`;
  const mountClassName = `layui-input-block layui-bpmn-panel__entry-mount${embedded ? ' layui-bpmn-panel__entry-mount--embedded' : ''}`;
  const entryKey = entry && entry.key ? entry.key : '';
  const component = entry && entry.component ? entry.component : '';
  const groupId = group && group.id ? group.id : '';
  const label = entry && (entry.label || entry.key) ? (entry.label || entry.key) : '';
  const previewHtml = componentDefinition ? '' : renderEntryPreviewHtml(entry);

  return `
    <div class="${escapeAttr(entryClassName)}" data-entry-index="${index}" 
        data-entry-key="${escapeAttr(entryKey)}" data-component="${escapeAttr(component)}" data-group-id="${escapeAttr(groupId)}">
      ${embedded ? '' : `<label class="layui-form-label layui-bpmn-panel__entry-label">${escapeHtml(label)}</label>`}
      <div class="${escapeAttr(mountClassName)}" data-entry-index="${index}" 
        data-entry-key="${escapeAttr(entryKey)}" data-component="${escapeAttr(component)}">${previewHtml}</div>
    </div>
  `;
}

function resolveEntryComponent(entry) {
  return entryComponents.find((component) => (
      component
      && typeof component.supportsEntry === 'function'
      && component.supportsEntry(entry)
  )) || null;
}

export function renderGroup(group, element, options = {}) {
  const documentRef = document;
  const entries = group && Array.isArray(group.entries) ? group.entries : [];
  const groupId = group && group.id ? group.id : '';
  const groupContent = htmlToElement(documentRef,
      `<div class="layui-colla-content layui-show layui-bpmn-panel__group-content" data-group-id="${escapeAttr(groupId)}">
                <div class="layui-bpmn-panel__group-fields" data-group-id="${escapeAttr(groupId)}">
                ${entries.map((entry, index) => renderEntryHtml(group, entry, index)).join('')}
                </div>
            </div>`
  );

  entries.forEach((entry, index) => {
    const mountEl = groupContent.querySelector(`[data-entry-index="${index}"].layui-bpmn-panel__entry-mount`);
    const component = resolveEntryComponent(entry);

    if (component) {
      component.createEntry(entry, group, element, options).mount(mountEl);
    }
  });

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
