import {
  createElement,
  executeCommands,
  getBusinessObject,
  getExpressionBody,
  getProperty,
  getTaskCollectionName,
  getTaskIndexFromElement,
  queryTypedExtensionElement
} from '../../../ModdleUtils.js';
import {getElementId, getStr, toStr} from '../../common/utils.js';
import {createMultiInstanceProperties} from "./MultiInstanceState";

const DEFAULT_ELEMENT_VARIABLE = 'assignee';
const DEFAULT_COMPLETION_CONDITION = '${auditFlowService.hasComplete(execution)}';
const ASSIGNEE_MODE_USER = 'user';


function isTruthy(value) {
  return value === true || value === 'true';
}

function getDefaultCollectionValue(element) {
  return getTaskCollectionName(getTaskIndexFromElement(element));
}

function getLoopCharacteristics(element) {
  return getProperty(getBusinessObject(element), 'loopCharacteristics');
}

function getTaskParameter(element, name) {
  const parametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  let values = getProperty(parametersElement, 'values');
  values = Array.isArray(values) ? values : [];
  const index = values.findIndex((parameter) => getStr(getProperty(parameter, 'name')).trim() === name);

  return index >= 0 ? values[index] : null;
}

function getTaskParameterValue(element, name, fallback = '') {
  const parameter = getTaskParameter(element, name);
  const value = getProperty(parameter, 'value');

  return typeof value === 'string' ? value : fallback;
}

function isSameMultiInstanceState(left, right) {
  const nextLeft = createMultiInstanceProperties(left);
  const nextRight = createMultiInstanceProperties(right);

  return JSON.stringify(nextLeft) === JSON.stringify(nextRight);
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

function copyMultiInstance(element) {
  const value = createDefaultMultiInstance(element);
  const loopCharacteristics = getLoopCharacteristics(element);
  const taskParameters = {
    assigneeMode: toStr(getTaskParameterValue(element, 'assigneeMode')),
    ids: toStr(getTaskParameterValue(element, 'ids')),
    names: toStr(getTaskParameterValue(element, 'names'))
  };

  if (!loopCharacteristics) {
    return {
      ...value,
      ...taskParameters
    };
  }

  return {
    ...value,
    ...taskParameters,
    enabled: true,
    isSequential: isTruthy(loopCharacteristics.isSequential),
    collection: getStr(getProperty(loopCharacteristics, 'flowable:collection'), value.collection),
    elementVariable: getStr(getProperty(loopCharacteristics, 'flowable:elementVariable'), value.elementVariable),
    loopCardinality: getExpressionBody(getProperty(loopCharacteristics, 'loopCardinality')),
    completionCondition: getExpressionBody(getProperty(loopCharacteristics, 'completionCondition'))
  };
}

function createDefaultMultiInstance(element) {
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

function createFormalExpression(moddle, parent, body) {
  const nextBody = getStr(body).trim();
  if (!nextBody) {
    return undefined;
  }

  const expression = moddle.create('bpmn:FormalExpression', { body });
  if (parent) {
    expression.$parent = parent;
  }

  return expression;
}

function createLoopCharacteristics(context, element, value) {
  const businessObject = getBusinessObject(element);
  const loopCharacteristics = createElement('bpmn:MultiInstanceLoopCharacteristics', {
    isSequential: value.isSequential,
    'flowable:collection': getStr(value.collection).trim(),
    'flowable:elementVariable': getStr(value.elementVariable).trim(),
    loopCardinality: createFormalExpression(context.moddle, null, value.loopCardinality),
    completionCondition: createFormalExpression(context.moddle, null, value.completionCondition)
  }, businessObject, context.bpmnFactory);

  if (loopCharacteristics.loopCardinality) {
    loopCharacteristics.loopCardinality.$parent = loopCharacteristics;
  }

  if (loopCharacteristics.completionCondition) {
    loopCharacteristics.completionCondition.$parent = loopCharacteristics;
  }

  return loopCharacteristics;
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

function syncAssigneeParameters(context, element, value) {
  const ensured = writeDefaultExtensionElements(context, element);
  const oldExtensionElements = ensured.extensionElements;
  const oldExtensionValues = getProperty(oldExtensionElements, 'values') || [];
  const oldParametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  const oldParameterValues = getProperty(oldParametersElement, 'values') || [];
  const preservedExtensionValues = oldExtensionValues.filter((value) => value !== oldParametersElement);
  const preservedParameterValues = (Array.isArray(oldParameterValues) ? oldParameterValues : []).filter((parameter) => {
    const name = toStr(getProperty(parameter, 'name')).trim();
    return name !== 'assigneeMode' && name !== 'ids' && name !== 'names';
  });
  const isUserMode = value.assigneeMode === ASSIGNEE_MODE_USER;
  const newParameterValues = isUserMode
    ? [
      ...preservedParameterValues,
      createElement('taskExt:Parameter', { name: 'assigneeMode', value: ASSIGNEE_MODE_USER }, null, context.bpmnFactory),
      createElement('taskExt:Parameter', { name: 'ids', value: getStr(value.ids) }, null, context.bpmnFactory),
      createElement('taskExt:Parameter', { name: 'names', value: toStr(value.names) }, null, context.bpmnFactory)
    ]
    : preservedParameterValues;
  const hasExtensionElements = !ensured.commands.length;

  if (!hasExtensionElements && !newParameterValues.length) {
    return {updated: false};
  }

  let newExtensionValues = preservedExtensionValues;
  if (newParameterValues.length) {
    const parametersElement = createElement('taskExt:Parameters', { values: newParameterValues }, oldExtensionElements, context.bpmnFactory);
    newParameterValues.forEach((parameter) => {
      parameter.$parent = parametersElement;
    });

    newExtensionValues = [...newExtensionValues, parametersElement];
  }

  if (!newExtensionValues.length) {
    return {
      updated: true,
      result: context.modeling.updateProperties(element, { extensionElements: undefined })
    };
  }

  return {
    updated: true,
    result: executeCommands(context.commandStack, [
        ...ensured.commands,
      {
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: oldExtensionElements,
          properties: {
            values: [ ...newExtensionValues ]
          }
        }
      }]
    )
  };
}

function buildAssigneeParameterCommands(context, element, value) {
  const ensured = writeDefaultExtensionElements(context, element);
  const oldExtensionElements = ensured.extensionElements;
  const oldExtensionValues = getProperty(oldExtensionElements, 'values') || [];
  const isUserMode = value.assigneeMode === ASSIGNEE_MODE_USER;

  const commands = [];
  let parametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  if (!parametersElement && isUserMode) {
    parametersElement = createElement('taskExt:Parameters', { values: [] }, oldExtensionElements, context.bpmnFactory);
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: oldExtensionElements,
        properties: {
          values: [ ...oldExtensionValues, parametersElement ]
        }
      }
    });
  }

  if (!parametersElement) {
    return commands;
  }

  const parameterValues = getProperty(parametersElement, 'values') || [];
  const preservedParameterValues = parameterValues.filter((parameter) => {
    const name = getStr(getProperty(parameter, 'name'), '').trim();
    return name !== 'assigneeMode' && name !== 'ids' && name !== 'names';
  });

  const newParameterValues = isUserMode
    ? [
      ...preservedParameterValues,
      createElement('taskExt:Parameter', { name: 'assigneeMode', value: ASSIGNEE_MODE_USER }, parametersElement, context.bpmnFactory),
      createElement('taskExt:Parameter', { name: 'ids', value: getStr(value.ids) }, parametersElement, context.bpmnFactory),
      createElement('taskExt:Parameter', { name: 'names', value: toStr(value.names) }, parametersElement, context.bpmnFactory)
    ]
    : preservedParameterValues;

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

  return [...ensured.commands, ...commands];
}

function validateValue(value = {}) {
  const nextValue = {
    enabled: !!value.enabled,
    isSequential: !!value.isSequential,
    collection: toStr(value.collection),
    elementVariable: toStr(value.elementVariable),
    loopCardinality: toStr(value.loopCardinality),
    completionCondition: toStr(value.completionCondition),
    assigneeMode: toStr(value.assigneeMode),
    ids: toStr(value.ids),
    names: toStr(value.names)
  };
  const errors = {};

  if (nextValue.enabled && !getStr(nextValue.collection).trim()) {
    errors.collection = 'collection is required when multi-instance is enabled';
  }

  if (nextValue.enabled && !getStr(nextValue.elementVariable).trim()) {
    errors.elementVariable = 'elementVariable is required when multi-instance is enabled';
  }

  if (nextValue.enabled && nextValue.assigneeMode === ASSIGNEE_MODE_USER && !getStr(nextValue.ids).trim()) {
    errors.ids = 'ids is required when assigneeMode is user';
  }

  return createValidationResult(errors, 'value', nextValue);
}

function applyChange(context, element, value = {}) {
  const validation = validateValue(value);
  const loopCharacteristics = getLoopCharacteristics(element);

  if (!validation.valid) {
    return { updated: false, validation };
  }

  if (!validation.value.enabled) {
    syncAssigneeParameters(context, element, validation.value);

    if (!loopCharacteristics) {
      return { updated: false, validation };
    }

    const result = context.modeling.updateProperties(element, {
      loopCharacteristics: undefined
    });

    return { updated: true, validation, result };
  }

  if (!loopCharacteristics) {
    const businessObject = getBusinessObject(element);
    const nextLoopCharacteristics = createLoopCharacteristics(context, element, validation.value);
    const commands = [
      ...buildAssigneeParameterCommands(context, element, validation.value),
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
    const result = executeCommands(context.commandStack, commands);

    return { updated: true, validation, result };
  }

  const nextData = validation.value;
  const nextLoopCharacteristics = createLoopCharacteristics(context, element, nextData);
  const result = context.modeling.updateProperties(element, {
    loopCharacteristics: nextLoopCharacteristics
  });
  syncAssigneeParameters(context, element, validation.value);

  return { updated: true, validation, result };
}

function createMultiInstanceEntryAdapter(entry, element, options = {}) {
  const context = options.context || null;
  const userPicker = typeof options.userPicker === 'function' ? options.userPicker : null;
  const uiState = options.uiState || null;

  if (!entry) {
    return entry;
  }

  entry.getValue = () => {
    const derivedValue = copyMultiInstance(element);
    const pendingResult = uiState && uiState.pendingMultiInstanceResult;

    if (!pendingResult || pendingResult.elementId !== getElementId(element)) {
      return derivedValue;
    }

    if (isSameMultiInstanceState(derivedValue, pendingResult.value)) {
      uiState.pendingMultiInstanceResult = null;
      return derivedValue;
    }

    return pendingResult.value;
  };
  entry.setValue = (value) => {
    if (uiState) {
      uiState.pendingMultiInstanceResult = {
        elementId: getElementId(element),
        value: createMultiInstanceProperties(value)
      };
      uiState.suppressMultiInstanceRender = {
        elementId: getElementId(element),
        remaining: 6
      };
    }

    const result = applyChange(context, element, value);

    if (uiState && (!result || !result.updated)) {
      uiState.pendingMultiInstanceResult = null;
    }

    return result;
  };
  entry.validate = (value) => validateValue(value);
  entry.pickUsers = (value = {}) => {
    if (!userPicker) {
      return null;
    }

    return userPicker({
      element,
      value: value,
      groupId: 'multi-instance',
      entryKey: entry.key || null
    });
  };

  return entry;
}

function bindMultiInstanceEntry(entry, group, element, options) {
  if (!(entry && group && group.id === 'multi-instance' && entry.key === 'multiInstanceEditor')) {
    return;
  }

  createMultiInstanceEntryAdapter(entry, element, options);
}

export default {
  bindMultiInstanceEntry
};
