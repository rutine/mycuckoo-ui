import {
  createElement,
  getBusinessObject,
  getTaskCollectionName,
  getTaskIndexFromElement,
  getExpressionBody,
  getProperty,
  executeCommands,
  queryTypedExtensionElements,
  queryTypedExtensionElement
} from '../../../ModdleUtils.js';
import {
  findGroupEntry,
  getElementId,
  getStr,
  toStr
} from '../../common/utils.js';
import {createMultiInstanceProperties} from "./MultiInstanceState";

const DEFAULT_ELEMENT_VARIABLE = 'assignee';
const DEFAULT_COMPLETION_CONDITION = '${auditFlowService.hasComplete(execution)}';
const ASSIGNEE_MODE_USER = 'user';


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

function copyMultiInstance(element) {
  const defaults = createDefaultMultiInstance(element);
  const loopCharacteristics = getLoopCharacteristics(element);
  const taskParameters = {
    assigneeMode: toStr(getTaskParameterValue(element, 'assigneeMode')),
    ids: toStr(getTaskParameterValue(element, 'ids')),
    names: toStr(getTaskParameterValue(element, 'names'))
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
    collection: getStr(getProperty(loopCharacteristics, 'flowable:collection'), defaults.collection),
    elementVariable: getStr(getProperty(loopCharacteristics, 'flowable:elementVariable'), defaults.elementVariable),
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

function validateDraft(draft = {}) {
  const normalizedDraft = {
    enabled: !!draft.enabled,
    isSequential: !!draft.isSequential,
    collection: toStr(draft.collection),
    elementVariable: toStr(draft.elementVariable),
    loopCardinality: toStr(draft.loopCardinality),
    completionCondition: toStr(draft.completionCondition),
    assigneeMode: toStr(draft.assigneeMode),
    ids: toStr(draft.ids),
    names: toStr(draft.names)
  };
  const errors = {};

  if (normalizedDraft.enabled && !getStr(normalizedDraft.collection).trim()) {
    errors.collection = 'collection is required when multi-instance is enabled';
  }

  if (normalizedDraft.enabled && !getStr(normalizedDraft.elementVariable).trim()) {
    errors.elementVariable = 'elementVariable is required when multi-instance is enabled';
  }

  if (normalizedDraft.enabled && normalizedDraft.assigneeMode === ASSIGNEE_MODE_USER && !getStr(normalizedDraft.ids).trim()) {
    errors.ids = 'ids is required when assigneeMode is user';
  }

  return createValidationResult(errors, 'draft', normalizedDraft);
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

function createLoopCharacteristics(context, element, draft) {
  const businessObject = getBusinessObject(element);
  const loopCharacteristics = createElement('bpmn:MultiInstanceLoopCharacteristics', {
    isSequential: draft.isSequential,
    'flowable:collection': getStr(draft.collection).trim(),
    'flowable:elementVariable': getStr(draft.elementVariable).trim(),
    loopCardinality: createFormalExpression(context.moddle, null, draft.loopCardinality),
    completionCondition: createFormalExpression(context.moddle, null, draft.completionCondition)
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

function syncAssigneeParameters(context, element, draft) {
  const ensured = writeDefaultExtensionElements(context, element);
  const oldExtensionValues = queryTypedExtensionElements(element, 'all');
  const oldParametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  const oldParameterValues = getProperty(oldParametersElement, 'values');
  const preservedParameterValues = (Array.isArray(oldParameterValues) ? oldParameterValues : []).filter((parameter) => {
    const name = toStr(getProperty(parameter, 'name')).trim();
    return name !== 'assigneeMode' && name !== 'ids' && name !== 'names';
  });
  const isUserMode = draft.assigneeMode === ASSIGNEE_MODE_USER;
  const newParameterValues = isUserMode
    ? [
      ...preservedParameterValues,
      createElement('taskExt:Parameter', {
        name: 'assigneeMode',
        value: ASSIGNEE_MODE_USER
      }, null, context.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'ids',
        value: getStr(draft.ids).trim()
      }, null, context.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'names',
        value: toStr(draft.names)
      }, null, context.bpmnFactory)
    ]
    : preservedParameterValues;
  const preservedExtensionValues = oldExtensionValues.filter((value) => value !== oldParametersElement);
  const hasExtensionElements = !ensured.commands.length;

  if (!hasExtensionElements && !newParameterValues.length) {
    return {updated: false};
  }

  if (!hasExtensionElements) {
    const extensionElements = ensured.extensionElements;
    const parametersElement = createElement(
        'taskExt:Parameters',
        { values: newParameterValues },
        extensionElements,
        context.bpmnFactory
    );
    newParameterValues.forEach((parameter) => {
      parameter.$parent = parametersElement;
    });
    extensionElements.values = [ parametersElement ];

    return {
      updated: true,
      result: context.modeling.updateProperties(element, { extensionElements })
    };
  }

  let newExtensionValues = preservedExtensionValues;
  if (newParameterValues.length) {
    const parametersElement = createElement(
        'taskExt:Parameters',
        { values: newParameterValues },
        ensured.extensionElements,
        context.bpmnFactory
    );
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
          moddleElement: ensured.extensionElements,
          properties: {
            values: [ ...newExtensionValues ]
          }
        }
      }]
    )
  };
}

function buildAssigneeParameterCommands(context, element, draft) {
  const ensured = writeDefaultExtensionElements(context, element);
  const oldExtensionElements = ensured.extensionElements;
  const oldExtensionValues = getProperty(oldExtensionElements, 'values');
  const isUserMode = draft.assigneeMode === ASSIGNEE_MODE_USER;

  const commands = [];
  let parametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  if (!parametersElement && isUserMode) {
    parametersElement = createElement(
        'taskExt:Parameters',
        { values: [] },
        oldExtensionElements,
        context.bpmnFactory
    );
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

  const parameterValues = Array.isArray(getProperty(parametersElement, 'values'))
    ? getProperty(parametersElement, 'values')
    : [];
  const preservedParameterValues = parameterValues.filter((parameter) => {
    const name = getStr(getProperty(parameter, 'name'), '').trim();
    return name !== 'assigneeMode' && name !== 'ids' && name !== 'names';
  });

  const newParameterValues = isUserMode
    ? [
      ...preservedParameterValues,
      createElement('taskExt:Parameter', {
        name: 'assigneeMode',
        value: ASSIGNEE_MODE_USER
      }, parametersElement, context.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'ids',
        value: getStr(draft.ids).trim()
      }, parametersElement, context.bpmnFactory),
      createElement('taskExt:Parameter', {
        name: 'names',
        value: toStr(draft.names)
      }, parametersElement, context.bpmnFactory)
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

function applyChange(context, element, draft = {}) {
  const validation = validateDraft(draft);
  const loopCharacteristics = getLoopCharacteristics(element);

  if (!validation.valid) {
    return { updated: false, validation };
  }

  if (!validation.draft.enabled) {
    syncAssigneeParameters(context, element, validation.draft);

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
    const nextLoopCharacteristics = createLoopCharacteristics(context, element, validation.draft);
    const commands = [
      ...buildAssigneeParameterCommands(context, element, validation.draft),
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

  const nextDraft = validation.draft;
  const nextLoopCharacteristics = createLoopCharacteristics(context, element, nextDraft);
  const result = context.modeling.updateProperties(element, {
    loopCharacteristics: nextLoopCharacteristics
  });
  syncAssigneeParameters(context, element, validation.draft);

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
    const derivedDraft = copyMultiInstance(element);
    const pendingDraft = uiState && uiState.pendingMultiInstanceDraft;

    if (!pendingDraft || pendingDraft.elementId !== getElementId(element)) {
      return derivedDraft;
    }

    if (isSameMultiInstanceState(derivedDraft, pendingDraft.draft)) {
      uiState.pendingMultiInstanceDraft = null;
      return derivedDraft;
    }

    return pendingDraft.draft;
  };
  entry.validate = (draft) => validateDraft(draft);
  entry.pickUsers = (draft = {}) => {
    if (!userPicker) {
      return null;
    }

    return userPicker({
      element,
      draft,
      groupId: 'multi-instance',
      entryKey: entry.key || null
    });
  };
  entry.setValue = (draft) => {
    if (uiState) {
      uiState.pendingMultiInstanceDraft = {
        elementId: getElementId(element),
        draft: createMultiInstanceProperties(draft)
      };
      uiState.suppressMultiInstanceRender = {
        elementId: getElementId(element),
        remaining: 6
      };
    }

    if (!context) {
      return {
        updated: false,
        notApplied: true,
        reason: 'missing-context',
        validation: validateDraft(draft)
      };
    }

    const result = applyChange(context, element, draft);

    if (uiState && (!result || !result.updated)) {
      uiState.pendingMultiInstanceDraft = null;
    }

    return result;
  };

  return entry;
}

function bindMultiInstanceEntry(entry, group, element, options) {
  // const entry = findGroupEntry(panelState, 'multi-instance', 'multiInstanceEditor');

  if (!!(entry && group && group.id === 'multi-instance' && entry.key === 'multiInstanceEditor')) {
    return;
  }

  createMultiInstanceEntryAdapter(entry, element, options);
}

export default {
  bindMultiInstanceEntry
};
