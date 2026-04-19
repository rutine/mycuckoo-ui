import { resolvePanelState } from './public-api.js';
import { collectLayuiSelectBindings } from './render/fields.js';
import { renderPanel } from './render/panel.js';
import {
  appendClassName,
  getElementId,
  normalizeText,
  removeClassName
} from './utils.js';

function findFirstElement(root, matcher) {
  if (!root) {
    return null;
  }

  if (matcher(root)) {
    return root;
  }

  const children = root && root.children ? Array.from(root.children) : [];

  for (let index = 0; index < children.length; index += 1) {
    const matched = findFirstElement(children[index], matcher);

    if (matched) {
      return matched;
    }
  }

  return null;
}

function findLastListenerValueInput(container) {
  let target = null;

  (function walk(node) {
    if (!node) {
      return;
    }

    const children = node && node.children ? Array.from(node.children) : [];

    children.forEach((child) => {
      walk(child);
    });

    if (
      String(node.tagName || '').toLowerCase() === 'input' &&
      node.dataset &&
      node.dataset.field === 'value'
    ) {
      target = node;
    }
  })(container);

  return target;
}

function getLayuiForm() {
  const layuiRef =
    (typeof window !== 'undefined' && window && window.layui) ||
    (typeof layui !== 'undefined' && layui) ||
    null;

  return layuiRef && layuiRef.form;
}

function rerenderLayuiForm() {
  const form = getLayuiForm();

  if (!form || typeof form.render !== 'function') {
    return null;
  }

  form.render();
  return form;
}

function bindLayuiSelect(form, bindings = []) {
  if (!form || typeof form.on !== 'function') {
    return;
  }

  const registry = this && this._layuiSelectBindings instanceof Map
    ? this._layuiSelectBindings
    : new Map();
  const nextFilters = new Set();

  bindings.forEach((binding) => {
    if (!binding || !binding.filter || typeof binding.onChange !== 'function') {
      return;
    }

    nextFilters.add(binding.filter);
    registry.set(binding.filter, binding);

    if (registry.get(`${binding.filter}:bound`)) {
      return;
    }

    registry.set(`${binding.filter}:bound`, true);
    form.on(`select(${binding.filter})`, (data) => {
      const activeBinding = registry.get(binding.filter);

      if (!activeBinding) {
        return;
      }

      if (activeBinding.element) {
        activeBinding.element.value = normalizeText(data && data.value);
      }

      activeBinding.onChange(data && data.value, data);
    });
  });

  Array.from(registry.keys()).forEach((key) => {
    if (/:bound$/.test(key)) {
      const filter = key.replace(/:bound$/, '');

      if (!nextFilters.has(filter)) {
        registry.delete(key);
      }

      return;
    }

    if (!nextFilters.has(key)) {
      registry.delete(key);
    }
  });
}

export default class LayuiPropertiesPanel {
  constructor(eventBus, selection, bpmnFactory, commandStack, modeling, moddle, config = {}) {
    this._eventBus = eventBus;
    this._selection = selection;
    this._config = config || {};
    this._services = {
      bpmnFactory,
      commandStack,
      modeling,
      moddle
    };
    this._uiState = {
      pendingFocus: null,
      pendingMultiInstanceDraft: null,
      suppressMultiInstanceRender: null
    };
    this._layuiSelectBindings = new Map();

    this._container = this._ensureContainer();

    this._eventBus.on('import.done', () => this._render());
    this._eventBus.on('selection.changed', () => this._render());
    this._eventBus.on('commandStack.changed', () => {
      if (this._shouldSuppressMultiInstanceRender()) {
        return;
      }

      this._render();
    });

    this._render();
  }

  _ensureContainer() {
    const parent = this._resolveParent(this._config);

    if (!parent) {
      return null;
    }

    let container = parent.querySelector('.layui-bpmn-properties-host');

    if (!container) {
      container = document.createElement('div');
      container.className = 'layui-bpmn-properties-host';
      parent.appendChild(container);
    }

    return container;
  }

  _resolveParent(config) {
    const parent = config && config.parent;

    if (typeof parent === 'string') {
      return document.querySelector(parent);
    }

    if (parent && parent.nodeType === 1) {
      return parent;
    }

    return null;
  }

  _render() {
    if (!this._container) {
      return;
    }

    const selection = this._selection && this._selection.get ? this._selection.get() : [];
    const element = selection && selection.length ? selection[0] : null;

    if (
      this._uiState.pendingMultiInstanceDraft &&
      this._uiState.pendingMultiInstanceDraft.elementId !== getElementId(element)
    ) {
      this._uiState.pendingMultiInstanceDraft = null;
    }

    if (
      this._uiState.suppressMultiInstanceRender &&
      this._uiState.suppressMultiInstanceRender.elementId !== getElementId(element)
    ) {
      this._uiState.suppressMultiInstanceRender = null;
    }

    const panelState = resolvePanelState(element, {
      services: this._services,
      uiState: this._uiState,
      userPicker: this._config.userPicker,
      listenerSelectMode: this._config.listenerSelectMode
    });

    renderPanel(this._container, panelState);
    const form = rerenderLayuiForm();
    bindLayuiSelect.call(this, form, collectLayuiSelectBindings(this._container));
    if (form) {
      appendClassName(this._container, 'layui-bpmn-properties-host--layui-rendered');
    } else {
      removeClassName(this._container, 'layui-bpmn-properties-host--layui-rendered');
    }
    this._restorePendingFocus(element);
  }

  _shouldSuppressMultiInstanceRender() {
    const suppressState = this._uiState && this._uiState.suppressMultiInstanceRender;
    const pendingDraft = this._uiState && this._uiState.pendingMultiInstanceDraft;
    const selection = this._selection && this._selection.get ? this._selection.get() : [];
    const element = selection && selection.length ? selection[0] : null;
    const elementId = getElementId(element);
    const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
    const activeInsidePanel = !!(
      activeElement &&
      this._container &&
      typeof this._container.contains === 'function' &&
      this._container.contains(activeElement)
    );
    const activeInsideMultiInstance = !!(
      activeInsidePanel &&
      typeof activeElement.closest === 'function' &&
      activeElement.closest('.layui-bpmn-panel__multi-instance-editor')
    );

    if (
      !suppressState ||
      !pendingDraft ||
      suppressState.elementId !== elementId ||
      pendingDraft.elementId !== elementId ||
      !activeInsideMultiInstance
    ) {
      return false;
    }

    suppressState.remaining -= 1;

    if (suppressState.remaining <= 0) {
      this._uiState.suppressMultiInstanceRender = null;
    }

    return true;
  }

  _restorePendingFocus(element) {
    const pendingFocus = this._uiState && this._uiState.pendingFocus;

    if (!pendingFocus || pendingFocus.elementId !== getElementId(element)) {
      return;
    }

    let focusTarget = null;

    if (pendingFocus.kind === 'listener-value-last') {
      focusTarget = findLastListenerValueInput(this._container);
    }

    if (!focusTarget || typeof focusTarget.focus !== 'function') {
      return;
    }

    focusTarget.focus();
    this._uiState.pendingFocus = null;
  }
}

LayuiPropertiesPanel.$inject = [
  'eventBus',
  'selection',
  'bpmnFactory',
  'commandStack',
  'modeling',
  'moddle',
  'config.layuiPropertiesPanel'
];
