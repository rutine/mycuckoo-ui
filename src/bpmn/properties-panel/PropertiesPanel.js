import PropertiesProvider from './provider/PropertiesProvider.js';
import {appendClassName, getElementId, removeClassName} from './common/utils.js';

function findFirstElement(root, matcher) {
  if (!root) {
    return null;
  }
  if (matcher(root)) {
    return root;
  }

  const children = root.children ? Array.from(root.children) : [];
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

    const children = node.children ? Array.from(node.children) : [];
    children.forEach((child) => {
      walk(child);
    });

    if (String(node.tagName || '').toLowerCase() === 'input'
        && node.dataset && node.dataset.field === 'value') {
      target = node;
    }
  })(container);

  return target;
}

function getLayuiForm() {
  const layuiRef = (typeof window !== 'undefined' && window && window.layui)
      || (typeof layui !== 'undefined' && layui)
      || null;

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

export default class PropertiesPanel {
  constructor(eventBus, selection, bpmnFactory, commandStack, modeling, moddle, canvas, config = {}) {
    this._eventBus = eventBus;
    this._selection = selection;
    this._canvas = canvas;
    this._config = config || {};
    this._context = {
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
    this._panelProvider = new PropertiesProvider(this._container);

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

  _getProcessElement() {
    const rootElement = this._canvas && typeof this._canvas.getRootElement === 'function'
      ? this._canvas.getRootElement()
      : null;

    return findFirstElement(rootElement, (element) => {
      if (!element) {
        return null;
      }
      const businessObject = element.businessObject;
      return element.type === 'bpmn:Process' || (businessObject && businessObject.$type === 'bpmn:Process');
    });
  }

  _getActiveElement() {
    const selection = this._selection && this._selection.get ? this._selection.get() : [];
    if (selection && selection.length) {
      return selection[0];
    }

    return this._getProcessElement();
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

    return (parent && parent.nodeType === 1) ? parent : null;
  }

  _render() {
    if (!this._container) {
      return;
    }

    const element = this._getActiveElement();
    if (this._uiState.pendingMultiInstanceDraft
        && this._uiState.pendingMultiInstanceDraft.elementId !== getElementId(element)) {
      this._uiState.pendingMultiInstanceDraft = null;
    }

    if (this._uiState.suppressMultiInstanceRender
        && this._uiState.suppressMultiInstanceRender.elementId !== getElementId(element)) {
      this._uiState.suppressMultiInstanceRender = null;
    }

    this._panelProvider.render(element, {
      context: this._context,
      uiState: this._uiState,
      userPicker: this._config.userPicker,
      listenerSelectMode: this._config.listenerSelectMode
    });

    const form = rerenderLayuiForm();
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
    const element = this._getActiveElement();
    const elementId = getElementId(element);
    const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
    const activeInsidePanel = !!(activeElement
        && this._container
        && typeof this._container.contains === 'function'
        && this._container.contains(activeElement));
    const activeInsideMultiInstance = !!(activeInsidePanel
        && typeof activeElement.closest === 'function'
        && activeElement.closest('.layui-bpmn-panel__multi-instance-editor'));

    if (!suppressState
        || !pendingDraft
        || suppressState.elementId !== elementId
        || pendingDraft.elementId !== elementId
        || !activeInsideMultiInstance) {
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

PropertiesPanel.$inject = [
  'eventBus',
  'selection',
  'bpmnFactory',
  'commandStack',
  'modeling',
  'moddle',
  'canvas',
  'config.myPropertiesPanel'
];
