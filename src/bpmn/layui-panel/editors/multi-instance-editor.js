import {
  createElement,
  getBusinessObject,
  getParametersElement,
  getTaskCollectionName,
  getTaskIndexFromElement,
  readExpressionBody,
  readModdleProperty
} from '../../util.js';
import {
  createFormalExpression,
  getTaskParameterValue,
  updateModdleProperties
} from '../services/extensions.js';
import {
  createValidationResult,
  executeCommands,
  normalizeString,
  trimValue
} from './shared.js';

export const DEFAULT_ELEMENT_VARIABLE = 'assignee';
export const DEFAULT_COMPLETION_CONDITION = '${auditFlowService.hasComplete(execution)}';
export const ASSIGNEE_MODE_USER = 'user';

function isTruthy(value) {
  return value === true || value === 'true';
}

function getDefaultCollectionValue(element) {
  return getTaskCollectionName(getTaskIndexFromElement(element));
}

function getLoopCharacteristics(element) {
  const businessObject = getBusinessObject(element);

  return readModdleProperty(businessObject, 'loopCharacteristics');
}

export function createDefaultDraft(element) {
  return {
    enabled: false,
    isSequential: false,
    collection: getDefaultCollectionValue(element),
    elementVariable: DEFAULT_ELEMENT_VARIABLE,
    loopCardinality: '',
    completionCondition: DEFAULT_COMPLETION_CONDITION,
    assigneeMode: '',
    ids: '',
    names: ''
  };
}

export function deriveDraft(element) {
  const defaults = createDefaultDraft(element);
  const loopCharacteristics = getLoopCharacteristics(element);
  const taskParameters = {
    assigneeMode: normalizeString(getTaskParameterValue(element, 'assigneeMode')),
    ids: normalizeString(getTaskParameterValue(element, 'ids')),
    names: normalizeString(getTaskParameterValue(element, 'names'))
  };

  if (!loopCharacteristics) {
    return {
      ...defaults,
      ...taskParameters
    };
  }

  return {
    ...defaults,
    ...taskParameters,
    enabled: true,
    isSequential: isTruthy(loopCharacteristics.isSequential),
    collection: normalizeString(
      readModdleProperty(loopCharacteristics, 'flowable:collection'),
      defaults.collection
    ) || defaults.collection,
    elementVariable: normalizeString(
      readModdleProperty(loopCharacteristics, 'flowable:elementVariable'),
      defaults.elementVariable
    ) || defaults.elementVariable,
    loopCardinality: readExpressionBody(readModdleProperty(loopCharacteristics, 'loopCardinality')),
    completionCondition: readExpressionBody(readModdleProperty(loopCharacteristics, 'completionCondition'))
  };
}

export function validateDraft(draft = {}) {
  const normalizedDraft = {
    enabled: !!draft.enabled,
    isSequential: !!draft.isSequential,
    collection: normalizeString(draft.collection),
    elementVariable: normalizeString(draft.elementVariable),
    loopCardinality: normalizeString(draft.loopCardinality),
    completionCondition: normalizeString(draft.completionCondition),
    assigneeMode: normalizeString(draft.assigneeMode),
    ids: normalizeString(draft.ids),
    names: normalizeString(draft.names)
  };
  const errors = {};

  if (normalizedDraft.enabled && !trimValue(normalizedDraft.collection)) {
    errors.collection = 'collection is required when multi-instance is enabled';
  }

  if (normalizedDraft.enabled && !trimValue(normalizedDraft.elementVariable)) {
    errors.elementVariable = 'elementVariable is required when multi-instance is enabled';
  }

  if (normalizedDraft.enabled && normalizedDraft.assigneeMode === ASSIGNEE_MODE_USER && !trimValue(normalizedDraft.ids)) {
    errors.ids = 'ids is required when assigneeMode is user';
  }

  return createValidationResult(errors, 'draft', normalizedDraft);
}

function ensureServices(services = {}) {
  const requiredKeys = [ 'bpmnFactory', 'commandStack', 'modeling', 'moddle' ];

  requiredKeys.forEach((key) => {
    if (!services[key]) {
      throw new Error(`multi-instance applyDraft requires services.${key}`);
    }
  });

  return services;
}

function toExpression(moddle, parent, body) {
  const nextBody = trimValue(body);

  return nextBody ? createFormalExpression(moddle, parent, nextBody) : undefined;
}

function createLoopCharacteristics(services, element, draft) {
  const businessObject = getBusinessObject(element);
  const loopCharacteristics = createElement('bpmn:MultiInstanceLoopCharacteristics', {
    isSequential: draft.isSequential,
    'flowable:collection': trimValue(draft.collection),
    'flowable:elementVariable': trimValue(draft.elementVariable),
    loopCardinality: toExpression(services.moddle, null, draft.loopCardinality),
    completionCondition: toExpression(services.moddle, null, draft.completionCondition)
  }, businessObject, services.bpmnFactory);

  if (loopCharacteristics.loopCardinality) {
    loopCharacteristics.loopCardinality.$parent = loopCharacteristics;
  }

  if (loopCharacteristics.completionCondition) {
    loopCharacteristics.completionCondition.$parent = loopCharacteristics;
  }

  return loopCharacteristics;
}

function syncAssigneeParameters(services, element, draft) {
  const businessObject = getBusinessObject(element);
  const oldExtensionElements = businessObject && readModdleProperty(businessObject, 'extensionElements');
  const oldExtensionValues = Array.isArray(readModdleProperty(oldExtensionElements, 'values'))
    ? readModdleProperty(oldExtensionElements, 'values')
    : [];
  const oldParametersElement = getParametersElement(element, 'taskExt:Parameters');
  const oldParameterValues = Array.isArray(readModdleProperty(oldParametersElement, 'values'))
    ? readModdleProperty(oldParametersElement, 'values')
    : [];
  const preservedParameterValues = oldParameterValues.filter((parameter) => {
    const name = normalizeString(readModdleProperty(parameter, 'name')).trim();

    return name !== 'assigneeMode' && name !== 'ids' && name !== 'names';
  });
  const isUserMode = draft.assigneeMode === ASSIGNEE_MODE_USER;
  const newParameterValues = isUserMode
    ? [
      ...preservedParameterValues,
      createElement('taskExt:Parameter', {
        name: 'assigneeMode',
        value: ASSIGNEE_MODE_USER
      }, null, services.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'ids',
        value: trimValue(draft.ids)
      }, null, services.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'names',
        value: normalizeString(draft.names)
      }, null, services.bpmnFactory)
    ]
    : preservedParameterValues;
  const preservedExtensionValues = oldExtensionValues.filter((value) => value !== oldParametersElement);

  if (!oldExtensionElements && !newParameterValues.length) {
    return {
      updated: false
    };
  }

  if (!oldExtensionElements) {
    const extensionElements = createElement('bpmn:ExtensionElements', { values: [] }, businessObject, services.bpmnFactory);
    const parametersElement = createElement('taskExt:Parameters', { values: newParameterValues }, extensionElements, services.bpmnFactory);

    newParameterValues.forEach((parameter) => {
      parameter.$parent = parametersElement;
    });

    extensionElements.values = [ parametersElement ];

    return {
      updated: true,
      result: services.modeling.updateProperties(element, {
        extensionElements
      })
    };
  }

  if (!newParameterValues.length) {
    const newExtensionValues = preservedExtensionValues;

    if (!newExtensionValues.length) {
      return {
        updated: true,
        result: services.modeling.updateProperties(element, {
          extensionElements: undefined
        })
      };
    }

    return {
      updated: true,
      result: updateModdleProperties(services.commandStack, element, oldExtensionElements, {
        values: newExtensionValues
      })
    };
  }

  const parametersElement = createElement('taskExt:Parameters', { values: newParameterValues }, oldExtensionElements, services.bpmnFactory);

  newParameterValues.forEach((parameter) => {
    parameter.$parent = parametersElement;
  });

  return {
    updated: true,
    result: updateModdleProperties(services.commandStack, element, oldExtensionElements, {
      values: [ ...preservedExtensionValues, parametersElement ]
    })
  };
}

function buildAssigneeParameterCommands(services, element, draft) {
  const businessObject = getBusinessObject(element);
  const extensionElements = businessObject && readModdleProperty(businessObject, 'extensionElements');
  const isUserMode = draft.assigneeMode === ASSIGNEE_MODE_USER;
  const commands = [];

  if (!businessObject) {
    return commands;
  }

  let newExtensionElements = extensionElements;

  if (!newExtensionElements && isUserMode) {
    newExtensionElements = createElement('bpmn:ExtensionElements', { values: [] }, businessObject, services.bpmnFactory);
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: businessObject,
        properties: {
          extensionElements: newExtensionElements
        }
      }
    });
  }

  const extensionValues = Array.isArray(readModdleProperty(newExtensionElements, 'values'))
    ? readModdleProperty(newExtensionElements, 'values')
    : [];
  let parametersElement = getParametersElement(element, 'taskExt:Parameters');

  if (!parametersElement && newExtensionElements) {
    parametersElement = extensionValues.find((value) => value && typeof value.$instanceOf === 'function' && value.$instanceOf('taskExt:Parameters')) || null;
  }

  if (!parametersElement && isUserMode && newExtensionElements) {
    parametersElement = createElement('taskExt:Parameters', { values: [] }, newExtensionElements, services.bpmnFactory);
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: newExtensionElements,
        properties: {
          values: [ ...extensionValues, parametersElement ]
        }
      }
    });
  }

  if (!parametersElement) {
    return commands;
  }

  const parameterValues = Array.isArray(readModdleProperty(parametersElement, 'values'))
    ? readModdleProperty(parametersElement, 'values')
    : [];
  const preservedValues = parameterValues.filter((parameter) => {
    const name = typeof readModdleProperty(parameter, 'name') === 'string'
      ? readModdleProperty(parameter, 'name').trim()
      : '';

    return name !== 'assigneeMode' && name !== 'ids' && name !== 'names';
  });

  const newParameterValues = isUserMode
    ? [
      ...preservedValues,
      createElement('taskExt:Parameter', {
        name: 'assigneeMode',
        value: ASSIGNEE_MODE_USER
      }, parametersElement, services.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'ids',
        value: trimValue(draft.ids)
      }, parametersElement, services.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'names',
        value: normalizeString(draft.names)
      }, parametersElement, services.bpmnFactory)
    ]
    : preservedValues;

  commands.push({
    cmd: 'element.updateModdleProperties',
    context: {
      element,
      moddleElement: parametersElement,
      properties: {
        values: newParameterValues
      }
    }
  });

  return commands;
}

export function applyDraft(services, element, draft = {}) {
  const resolvedServices = ensureServices(services);
  const validation = validateDraft(draft);
  const loopCharacteristics = getLoopCharacteristics(element);

  if (!validation.valid) {
    return {
      updated: false,
      validation
    };
  }

  if (!validation.draft.enabled) {
    syncAssigneeParameters(resolvedServices, element, validation.draft);

    if (!loopCharacteristics) {
      return {
        updated: false,
        validation
      };
    }

    const result = resolvedServices.modeling.updateProperties(element, {
      loopCharacteristics: undefined
    });

    return {
      updated: true,
      validation,
      result
    };
  }

  if (!loopCharacteristics) {
    const businessObject = getBusinessObject(element);
    const nextLoopCharacteristics = createLoopCharacteristics(resolvedServices, element, validation.draft);
    const commands = [
      ...buildAssigneeParameterCommands(resolvedServices, element, validation.draft),
      {
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject,
          properties: {
            loopCharacteristics: nextLoopCharacteristics
          }
        }
      }
    ];
    const result = executeCommands(resolvedServices.commandStack, commands);

    return {
      updated: true,
      validation,
      result
    };
  }

  const nextDraft = validation.draft;
  const nextLoopCharacteristics = createLoopCharacteristics(resolvedServices, element, nextDraft);
  const result = resolvedServices.modeling.updateProperties(element, {
    loopCharacteristics: nextLoopCharacteristics
  });
  syncAssigneeParameters(resolvedServices, element, validation.draft);

  return {
    updated: true,
    validation,
    result
  };
}

export default {
  deriveDraft,
  validateDraft,
  applyDraft
};
