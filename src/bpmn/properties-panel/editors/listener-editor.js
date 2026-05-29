import {
  createElement,
  getBusinessObject,
  readModdleProperty
} from '../../util.js';
import {
  createValidationResult,
  executeCommands,
  normalizeString,
  trimValue
} from './shared.js';

export const DEFAULT_LISTENER_EVENT = 'assignment';
export const DEFAULT_LISTENER_TYPE = 'expression';
export const DEFAULT_LISTENER_EXPRESSION = '${auditFlowService.beforeTask(execution)}';
export const SUPPORTED_LISTENER_TYPES = [ 'expression', 'class', 'delegateExpression' ];
export const SUPPORTED_LISTENER_EVENTS = [ 'assignment', 'create', 'complete', 'delete', 'all' ];

function getExtensionElements(element) {
  const businessObject = getBusinessObject(element);

  return readModdleProperty(businessObject, 'extensionElements');
}

function getExtensionValues(element) {
  const extensionElements = getExtensionElements(element);
  const values = readModdleProperty(extensionElements, 'values');

  return Array.isArray(values) ? values : [];
}

function listListenerElements(element) {
  return getExtensionValues(element).filter((value) => value && value.$type === 'flowable:TaskListener');
}

function readListenerValue(listener) {
  for (const type of SUPPORTED_LISTENER_TYPES) {
    const value = normalizeString(readModdleProperty(listener, type));

    if (trimValue(value)) {
      return {
        type,
        value
      };
    }
  }

  return {
    type: DEFAULT_LISTENER_TYPE,
    value: ''
  };
}

function normalizeDraft(draft = {}) {
  return {
    event: normalizeString(draft.event, DEFAULT_LISTENER_EVENT),
    type: normalizeString(draft.type, DEFAULT_LISTENER_TYPE),
    value: normalizeString(draft.value)
  };
}

function createListenerProperties(draft) {
  const properties = {
    event: draft.event,
    expression: undefined,
    class: undefined,
    delegateExpression: undefined
  };

  properties[draft.type] = draft.value;

  return properties;
}

function ensureExtensionElements(services, element) {
  const businessObject = getBusinessObject(element);
  const extensionElements = getExtensionElements(element);

  if (extensionElements) {
    return {
      extensionElements,
      commands: []
    };
  }

  const nextExtensionElements = createElement(
    'bpmn:ExtensionElements',
    { values: [] },
    businessObject,
    services.bpmnFactory
  );

  return {
    extensionElements: nextExtensionElements,
    commands: [
      {
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject,
          properties: {
            extensionElements: nextExtensionElements
          }
        }
      }
    ]
  };
}

function getListenerAtIndex(element, index) {
  const listeners = listListenerElements(element);

  if (!Number.isInteger(index) || index < 0 || index >= listeners.length) {
    return null;
  }

  return listeners[index];
}

function addListener(services, element) {
  const ensured = ensureExtensionElements(services, element);
  const nextListener = createElement(
    'flowable:TaskListener',
    createListenerProperties(createDefaultDraft()),
    ensured.extensionElements,
    services.bpmnFactory
  );
  const values = readModdleProperty(ensured.extensionElements, 'values');

  executeCommands(services.commandStack, [
    ...ensured.commands,
    {
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: ensured.extensionElements,
        properties: {
          values: [ ...(Array.isArray(values) ? values : []), nextListener ]
        }
      }
    }
  ]);

  return {
    updated: true,
    value: createValue(element)
  };
}

function updateListener(services, element, index, draft) {
  const listener = getListenerAtIndex(element, index);

  if (!listener) {
    return {
      updated: false,
      reason: 'listener-not-found'
    };
  }

  const validation = validateDraft(draft);

  if (!validation.valid) {
    return {
      updated: false,
      validation
    };
  }

  services.commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement: listener,
    properties: createListenerProperties(validation.draft)
  });

  return {
    updated: true,
    validation,
    value: createValue(element)
  };
}

function removeListener(services, element, index) {
  const extensionElements = getExtensionElements(element);
  const listener = getListenerAtIndex(element, index);

  if (!extensionElements || !listener) {
    return {
      updated: false,
      reason: 'listener-not-found'
    };
  }

  const values = getExtensionValues(element).filter((value) => value !== listener);

  services.commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement: extensionElements,
    properties: {
      values
    }
  });

  return {
    updated: true,
    value: createValue(element)
  };
}

export function createDefaultDraft() {
  return {
    event: DEFAULT_LISTENER_EVENT,
    type: DEFAULT_LISTENER_TYPE,
    value: DEFAULT_LISTENER_EXPRESSION
  };
}

export function listListeners(element) {
  return listListenerElements(element).map((listener) => {
    const binding = readListenerValue(listener);

    return {
      event: normalizeString(readModdleProperty(listener, 'event')),
      type: binding.type,
      value: binding.value
    };
  });
}

export function validateDraft(draft = {}) {
  const normalizedDraft = normalizeDraft(draft);
  const errors = {};

  if (!trimValue(normalizedDraft.event)) {
    errors.event = 'event is required';
  }

  if (!SUPPORTED_LISTENER_EVENTS.includes(normalizedDraft.event)) {
    errors.event = 'listener event is not supported';
  }

  if (!SUPPORTED_LISTENER_TYPES.includes(normalizedDraft.type)) {
    errors.type = 'listener type is not supported';
  }

  if (!trimValue(normalizedDraft.value)) {
    errors.value = 'value is required';
  }

  return createValidationResult(errors, 'draft', normalizedDraft);
}

export function createValue(element) {
  return {
    kind: 'listener-editor',
    items: listListeners(element),
    draft: createDefaultDraft(),
    createDefaultDraft,
    validateDraft
  };
}

export function applyChange(services, element, value = {}) {
  if (!services || !services.commandStack || !services.bpmnFactory) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-services'
    };
  }

  switch (value.action) {
  case 'add':
    return addListener(services, element);
  case 'remove':
    return removeListener(services, element, value.index);
  case 'update':
    return updateListener(services, element, value.index, value.draft);
  default:
    return {
      updated: false,
      reason: 'unsupported-action'
    };
  }
}

export default {
  applyChange,
  createDefaultDraft,
  createValue,
  listListeners,
  validateDraft
};
