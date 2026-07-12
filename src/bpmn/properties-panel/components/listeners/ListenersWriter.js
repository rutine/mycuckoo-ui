import {
  createElement,
  executeCommands,
  getBusinessObject,
  getProperty,
  queryTypedExtensionElements
} from '../../../ModdleUtils.js';
import {getElementId, getStr} from '../../common/utils.js';

const DEFAULT_LISTENER_EVENT = 'assignment';
const DEFAULT_LISTENER_TYPE = 'expression';
const DEFAULT_LISTENER_EXPRESSION = '${auditFlowService.beforeTask(execution)}';
const SUPPORTED_LISTENER_TYPES = [ 'expression', 'class', 'delegateExpression' ];
const SUPPORTED_LISTENER_EVENTS = [ 'assignment', 'create', 'complete', 'delete', 'all' ];
const SUPPORTED_LISTENER_ACTIONS = [ 'add', 'remove', 'update' ];


function listListeners(element) {
  return queryTypedExtensionElements(element, 'flowable:TaskListener').map((listener) => {
    let binding = {type: DEFAULT_LISTENER_TYPE, value: ''};
    for (const type of SUPPORTED_LISTENER_TYPES) {
      const value = getStr(getProperty(listener, type));
      if (value.trim()) {
        binding = { type, value };
        break;
      }
    }

    return {
      event: getStr(getProperty(listener, 'event')),
      type: binding.type,
      value: binding.value
    };
  });
}

function getListenerElement(element, index) {
  const listeners = queryTypedExtensionElements(element, 'flowable:TaskListener');
  if (!Number.isInteger(index) || index < 0 || index >= listeners.length) {
    return null;
  }

  return listeners[index];
}

function createValidationResult(errors = {}, payloadKey, payload) {
  const result = {
    valid: Object.keys(errors).length === 0,
    errors,
    issues: Object.keys(errors).map((field) => ({
      field,
      message: errors[field]
    }))
  };

  if (payloadKey) {
    result[payloadKey] = payload;
  }

  return result;
}

function createDefaultListener() {
  return {
    event: DEFAULT_LISTENER_EVENT,
    type: DEFAULT_LISTENER_TYPE,
    value: DEFAULT_LISTENER_EXPRESSION
  };
}

function createListenerProperties(value) {
  const properties = {
    event: value.event,
    expression: undefined,
    class: undefined,
    delegateExpression: undefined
  };

  properties[value.type] = value.value;

  return properties;
}

function createListenerValue(element) {
  return {
    kind: 'listener-editor',
    items: listListeners(element)
  };
}

function writeDefaultExtensionElements(context, element) {
  const businessObject = getBusinessObject(element);
  const extensionElements = getProperty(businessObject, 'extensionElements');
  if (extensionElements) {
    return {extensionElements, commands: []};
  }

  const nextExtensionElements = createElement(
      'bpmn:ExtensionElements',
      { values: [] },
      businessObject,
      context.bpmnFactory
  );

  return {
    extensionElements: nextExtensionElements,
    commands: [{
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: businessObject,
        properties: {
          extensionElements: nextExtensionElements
        }
      }
    }]
  };
}

function addListener(context, element) {
  const ensured = writeDefaultExtensionElements(context, element);
  const nextListener = createElement('flowable:TaskListener',
      createListenerProperties(createDefaultListener()),
      ensured.extensionElements,
      context.bpmnFactory
  );

  let values = getProperty(ensured.extensionElements, 'values');
  values = Array.isArray(values) ? values : [];

  executeCommands(context.commandStack, [
    ...ensured.commands,
    {
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: ensured.extensionElements,
        properties: {
          values: [ ...values, nextListener ]
        }
      }
    }
  ]);

  return {
    updated: true,
    value: createListenerValue(element)
  };
}

function updateListener(context, element, index, data) {
  const listener = getListenerElement(element, index);
  if (!listener) {
    return { updated: false, reason: 'listener-not-found' };
  }

  context.commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement: listener,
    properties: createListenerProperties(data)
  });

  return { updated: true, value: createListenerValue(element) };
}

function removeListener(context, element, index) {
  const ensured = writeDefaultExtensionElements(context, element);
  const listener = getListenerElement(element, index);
  if (!listener) {
    return { updated: false, reason: 'listener-not-found' };
  }

  const values = queryTypedExtensionElements(element, 'all').filter((value) => value !== listener);
  context.commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement: ensured.extensionElements,
    properties: {
      values
    }
  });

  return { updated: true, value: createListenerValue(element) };
}

function validateValue(value = {}) {
  const nextValue = {
    event: getStr(value.event, DEFAULT_LISTENER_EVENT),
    type: getStr(value.type, DEFAULT_LISTENER_TYPE),
    value: getStr(value.value)
  };
  const errors = {};

  if (!nextValue.event.trim()) {
    errors.event = 'event is required';
  }

  if (!SUPPORTED_LISTENER_EVENTS.includes(nextValue.event)) {
    errors.event = 'listener event is not supported';
  }

  if (!SUPPORTED_LISTENER_TYPES.includes(nextValue.type)) {
    errors.type = 'listener type is not supported';
  }

  if (!nextValue.value.trim()) {
    errors.value = 'value is required';
  }

  return createValidationResult(errors, 'value', nextValue);
}

function validateAction(value = {}) {
  const action = getStr(value.action);
  const errors = {};

  if (!SUPPORTED_LISTENER_ACTIONS.includes(action)) {
    errors.action = 'listener action is not supported';
  }

  if ((action === 'remove' || action === 'update') && !Number.isInteger(value.index)) {
    errors.index = 'listener index is required';
  }

  return createValidationResult(errors, 'action', action);
}

function applyChange(context, element, value = {}) {
  if (!context || !context.commandStack || !context.bpmnFactory) {
    return {updated: false, notApplied: true, reason: 'missing-context'};
  }

  const actionValidation = validateAction(value);
  if (!actionValidation.valid) {
    if (actionValidation.errors && actionValidation.errors.action) {
      return {updated: false, reason: 'unsupported-action'};
    }

    return {updated: false, reason: 'listener-not-found'};
  }

  switch (value.action) {
    case 'add':
      return addListener(context, element);
    case 'update':
      return updateListener(context, element, value.index, value.value);
    case 'remove':
      return removeListener(context, element, value.index);
    default:
      return {updated: false, reason: 'unsupported-action'};
  }
}

function createListenerEntryAdapter(entry, element, options = {}) {
  const context = options.context || null;
  const uiState = options.uiState || null;

  if (!entry) {
    return entry;
  }

  entry.getValue = () => createListenerValue(element);
  entry.setValue = (value = {}) => {
    const shouldRestoreFocus = value && value.action === 'add' && uiState;

    if (shouldRestoreFocus) {
      uiState.pendingFocus = {
        kind: 'listener-value-last',
        elementId: getElementId(element)
      };
    }

    const result = applyChange(context, element, value);

    if (shouldRestoreFocus && (!result || !result.updated)) {
      uiState.pendingFocus = null;
    }

    return result;
  };
  entry.validate = (value = {}) => validateValue(value);
  entry.ui = {
    ...(entry.ui || {})
  };

  return entry;
}

function bindListenerEntry(entry, group, element, options) {
  if (!(entry && group && group.id === 'listeners' && entry.key === 'listenerEditor')) {
    return;
  }

  createListenerEntryAdapter(entry, element, options);
}

export default {
  bindListenerEntry
};
