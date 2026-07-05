import {
  createElement,
  executeCommands,
  getProperty,
  queryTypedExtensionElement,
  queryTypedExtensionElements,
  updateModdleProperties
} from '../../../ModdleUtils.js';
import {findGroupEntry, getStr, toStr} from '../../common/utils.js';
import {getBusinessObject} from "bpmn-js/lib/util/ModelUtil";

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

function unwrapDraftValue(value) {
  return value && value.draft ? value.draft : value;
}

function unwrapItemsValue(value) {
  return Array.isArray(value) ? value : value && value.items;
}

function createDefaultExtension() {
  return {
    key: ''
  };
}

function createExtensionProperties(extension = {}) {
  return {
    key: getStr(extension.key)
  };
}

function resolveExtensionProperties(value = {}) {
  return createExtensionProperties(value.extension || value.draft || value);
}

function createExtensionValue(element) {
  return {
    kind: 'extension-editor',
    scope: 'parameter',
    items: listExtensions(element),
    draft: createDefaultExtension(),
    createDefaultExtension,
    validators
  };

}

function getExtensionValues(parameter) {
  const extensionsElement = getProperty(parameter, 'extensions');
  const values = getProperty(extensionsElement, 'values');

  return {
    extensionsElement,
    values: Array.isArray(values) ? values : []
  };
}

function getParametersValues(element) {
  const parametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  const values = getProperty(parametersElement, 'values');

  return {
    parametersElement,
    values: Array.isArray(values) ? values : []
  };
}

function getParameterAtIndex(element, index) {
  const { parametersElement, values } = getParametersValues(element);
  const parameter = Number.isInteger(index) && index >= 0 && index < values.length
    ? values[index]
    : null;

  return {
    parametersElement,
    values,
    parameter
  };
}

function getParameterIndex(value = {}) {
  if (Number.isInteger(value.parameterIndex)) {
    return value.parameterIndex;
  }

  const draft = unwrapDraftValue(value);

  return Number.isInteger(draft && draft.parameterIndex) ? draft.parameterIndex : null;
}

function getExtensionIndex(value = {}) {
  if (Number.isInteger(value.extensionIndex)) {
    return value.extensionIndex;
  }

  if (Number.isInteger(value.index)) {
    return value.index;
  }

  const draft = unwrapDraftValue(value);

  return Number.isInteger(draft && draft.extensionIndex) ? draft.extensionIndex : null;
}

function createExtensionValidationForItems(items = []) {
  return {
    ...uniqueKeys(items),
    extensions: Array.isArray(items) ? items.map((item) => createExtensionProperties(item)) : []
  };
}

function createDefaultParameterExtensionsElement(context, element, parameter) {
  const oldElement = getProperty(parameter, 'extensions');
  if (oldElement) {
    return { extensionsElement: oldElement, commands: [] };
  }

  const extensionsElement = createElement('taskExt:Extensions', { values: [] }, parameter, context.bpmnFactory);

  return {
    extensionsElement,
    commands: [{
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: parameter,
        properties: {
          extensions: extensionsElement
        }
      }
    }]
  };
}

function getNextExtensionItemsForAction(element, value = {}) {
  const action = getStr(value.action);
  const items = listExtensions(element);
  const parameterIndex = getParameterIndex(value);
  const extensionIndex = getExtensionIndex(value);
  const draft = resolveExtensionProperties(value);

  if (action === 'add') {
    return [
      ...items,
      {
        parameterIndex,
        extensionIndex: null,
        ...draft
      }
    ];
  }

  if (action === 'update') {
    return items.map((item) => (item.parameterIndex === parameterIndex && item.extensionIndex === extensionIndex
            ? { ...item, ...draft } : item
    ));
  }

  if (action === 'remove') {
    return items.filter((item) => !(item.parameterIndex === parameterIndex && item.extensionIndex === extensionIndex));
  }

  return items;
}

function applyExtensionAdd(context, element, value = {}, validation) {
  const parameterIndex = getParameterIndex(value);
  const { parameter } = getParameterAtIndex(element, parameterIndex);

  if (!parameter) {
    return { updated: false, reason: 'parameter-not-found', validation };
  }

  const ensured = createDefaultParameterExtensionsElement(context, element, parameter);
  const { values } = getExtensionValues(parameter);
  const newExtension = createElement('taskExt:Extension',
      resolveExtensionProperties(value),
      ensured.extensionsElement, context.bpmnFactory);

  const result = executeCommands(context.commandStack, [
    ...ensured.commands,
    {
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: ensured.extensionsElement,
        properties: {
          values: [ ...values, newExtension ]
        }
      }
    }
  ]);

  return {
    updated: true,
    result,
    validation,
    extension: newExtension,
    value: createExtensionValue(element)
  };
}

function applyExtensionUpdate(context, element, value = {}, validation) {
  const parameterIndex = getParameterIndex(value);
  const extensionIndex = getExtensionIndex(value);
  const { parameter } = getParameterAtIndex(element, parameterIndex);
  const { values } = getExtensionValues(parameter);
  const extension = Number.isInteger(extensionIndex) ? values[extensionIndex] : null;

  if (!extension) {
    return {
      updated: false,
      reason: 'extension-not-found',
      validation
    };
  }

  const result = executeCommands(context.commandStack, [{
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: extension,
        properties: resolveExtensionProperties(value)
      }
    }]
  );

  return {
    updated: true,
    result,
    validation,
    extension,
    value: createExtensionValue(element)
  };
}

function applyExtensionRemove(context, element, value = {}, validation) {
  const parameterIndex = getParameterIndex(value);
  const extensionIndex = getExtensionIndex(value);
  const { parameter } = getParameterAtIndex(element, parameterIndex);
  const { extensionsElement, values } = getExtensionValues(parameter);
  const extension = Number.isInteger(extensionIndex) ? values[extensionIndex] : null;

  if (!extensionsElement || !extension) {
    return {
      updated: false,
      reason: 'extension-not-found',
      validation
    };
  }

  const result = executeCommands(context.commandStack, [{
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionsElement,
          properties: {
            values: values.filter((item, index) => index !== extensionIndex)
          }
        }
      }]
  );

  return {
    updated: true,
    result,
    validation,
    value: createExtensionValue(element)
  };
}

function groupExtensionItemsByParameter(items = []) {
  const groupedItems = new Map();
  items.forEach((item) => {
    const parameterIndex = Number.isInteger(item && item.parameterIndex) ? item.parameterIndex : null;
    if (parameterIndex === null) {
      return;
    }

    if (!groupedItems.has(parameterIndex)) {
      groupedItems.set(parameterIndex, []);
    }

    groupedItems.get(parameterIndex).push(createExtensionProperties(item));
  });

  return groupedItems;
}

function applyExtensionListReplacement(context, element, value = {}, validation) {
  const nextItems = unwrapItemsValue(value);
  const groupedItems = groupExtensionItemsByParameter(nextItems);
  const { values: parameters } = getParametersValues(element);
  const commands = [];

  parameters.forEach((parameter, parameterIndex) => {
    const nextExtensions = groupedItems.get(parameterIndex) || [];
    const current = getExtensionValues(parameter);

    if (!nextExtensions.length && !current.extensionsElement) {
      return;
    }

    const ensured = nextExtensions.length
      ? createDefaultParameterExtensionsElement(context, element, parameter)
      : {
        extensionsElement: current.extensionsElement,
        commands: []
      };

    if (!ensured.extensionsElement) {
      return;
    }

    const extensionElements = nextExtensions
        .map((extension) => createElement('taskExt:Extension', extension,
            ensured.extensionsElement, context.bpmnFactory))
        .filter(Boolean);

    commands.push(...ensured.commands, {
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: ensured.extensionsElement,
        properties: {
          values: extensionElements
        }
      }
    });
  });

  if (!commands.length) {
    return {
      updated: false,
      validation,
      value: createExtensionValue(element)
    };
  }

  const result = executeCommands(context.commandStack, commands);

  return {
    updated: true,
    result,
    validation,
    value: createExtensionValue(element)
  };
}

function validateParameter(parameter = {}) {
  const normalizedParameter = createParameterProperties(parameter);
  const errors = {};

  if (!getStr(normalizedParameter.name).trim()) {
    errors.name = 'name is required';
  }

  return createValidationResult(errors, 'parameter', normalizedParameter);
}

function addParameter(context, element, parameter = {}) {
  const ensured = writeDefaultExtensionElements(context, element);
  const extensionElements = ensured.extensionElements;
  const oldExtensionValues = queryTypedExtensionElements(element, 'all');
  let parametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  const commands = [ ...ensured.commands ];

  if (!parametersElement) {
    const newExtensionValues = Array.isArray(oldExtensionValues) ? oldExtensionValues : [];
    parametersElement = createElement('taskExt:Parameters', {
      values: []
    }, extensionElements, context.bpmnFactory);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: extensionElements,
        properties: {
          values: [ ...newExtensionValues, parametersElement ]
        }
      }
    });
  }

  const oldParameterValues = getProperty(parametersElement, 'values');
  const newParameterValues = Array.isArray(oldParameterValues) ? oldParameterValues : [];
  const parameterElement = createElement('taskExt:Parameter', {
    name: toStr(parameter.name),
    value: toStr(parameter.value)
  }, parametersElement, context.bpmnFactory);

  commands.push({
    cmd: 'element.updateModdleProperties',
    context: {
      element,
      moddleElement: parametersElement,
      properties: {
        values: [ ...newParameterValues, parameterElement ]
      }
    }
  });

  const result = executeCommands(context.commandStack, commands);

  return {
    updated: true,
    result,
    parameter: parameterElement,
    parametersElement
  };
}

function updateParameter(context, element, index, parameter = {}) {
  const parametersElement = queryTypedExtensionElement(element, 'taskExt:Parameters');
  const oldParameterValues = getProperty(parametersElement, 'values');
  const parameterElement = Array.isArray(oldParameterValues) ? oldParameterValues[index] : null;

  if (!parameterElement) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-parameter'
    };
  }

  const result = updateModdleProperties(context.commandStack, element, parameterElement, {
    name: toStr(parameter.name),
    value: toStr(parameter.value)
  });

  return {
    updated: true,
    result,
    parameter: parameterElement,
    parametersElement
  };
}

function createDefaultParameter(name = 'Parameter_0') {
  return {
    name: getStr(name, 'Parameter_0') || 'Parameter_0',
    value: ''
  };
}

function createParameterProperties(parameter = {}) {
  return {
    name: getStr(parameter.name),
    value: getStr(parameter.value)
  };
}

function createParameterValue(element) {
  return {
    kind: 'parameter-editor',
    items: listParameters(element),
    draft: createDefaultParameter(),
    createDefaultParameter: createDefaultParameter,
    validateParameter
  };
}

function listParameters(element) {
  const { values } = getParametersValues(element);

  return values.map((parameter, index) => ({
    index,
    ...createParameterProperties({
      name: getProperty(parameter, 'name'),
      value: getProperty(parameter, 'value')
    })
  }));
}

function listExtensions(element) {
  const { values } = getParametersValues(element);

  return values.flatMap((parameter, parameterIndex) => {
    const { values: extensions } = getExtensionValues(parameter);

    return extensions.map((extension, extensionIndex) => ({
      parameterIndex,
      parameterName: getStr(getProperty(parameter, 'name')),
      extensionIndex,
      ...createExtensionProperties({
        key: getProperty(extension, 'key')
      })
    }));
  });
}

function uniqueKeys(extensions = []) {
  const normalizedExtensions = Array.isArray(extensions)
    ? extensions.map((extension) => createExtensionProperties(extension))
    : [];
  const keyIndexes = new Map();

  normalizedExtensions.forEach((extension, index) => {
    const key = getStr(extension.key).trim();

    if (!key) {
      return;
    }

    if (!keyIndexes.has(key)) {
      keyIndexes.set(key, []);
    }

    keyIndexes.get(key).push(index);
  });

  const issues = [];

  keyIndexes.forEach((indexes, key) => {
    if (indexes.length < 2) {
      return;
    }

    issues.push({
      code: 'duplicate-key',
      indexes,
      key,
      message: 'extension key must be unique'
    });
  });

  return {
    valid: issues.length === 0,
    duplicateKeys: issues.map((issue) => issue.key),
    issues,
    extensions: normalizedExtensions
  };
}

function applyParameterChange(context, element, value = {}) {
  const nextValue = unwrapDraftValue(value);
  const validation = validateParameter(nextValue);
  const nextIndex = Number.isInteger(value && value.index)
    ? value.index
    : (Number.isInteger(nextValue && nextValue.index) ? nextValue.index : null);

  if (!validation.valid) {
    return { updated: false, validation };
  }

  const result = nextIndex === null
    ? addParameter(context, element, validation.parameter)
    : updateParameter(context, element, nextIndex, validation.parameter);

  return {
    ...result,
    validation
  };
}

function applyExtensionChange(context, element, value = {}) {
  const action = getStr(value.action);
  const nextItems = action ? getNextExtensionItemsForAction(element, value) : unwrapItemsValue(value);
  const validation = createExtensionValidationForItems(nextItems);

  if (!validation.valid) {
    return { updated: false, validation };
  }

  if (action === 'add') {
    return applyExtensionAdd(context, element, value, validation);
  }

  if (action === 'update') {
    return applyExtensionUpdate(context, element, value, validation);
  }

  if (action === 'remove') {
    return applyExtensionRemove(context, element, value, validation);
  }

  if (Array.isArray(nextItems)) {
    return applyExtensionListReplacement(context, element, value, validation);
  }

  return {
    updated: false,
    reason: 'unsupported-action',
    validation
  };
}

function createParameterEntryAdapter(entry, element, options = {}) {
  const context = options.context || null;

  if (!entry) {
    return entry;
  }

  entry.getValue = () => createParameterValue(element);
  entry.validate = (value = {}) => validateParameter(unwrapDraftValue(value));
  entry.setValue = (value = {}) => applyParameterChange(context, element, value);

  return entry;
}

function createExtensionEntryAdapter(entry, element, options = {}) {
  const context = options.context || null;

  if (!entry) {
    return entry;
  }

  entry.getValue = () => createExtensionValue(element);
  entry.validate = (value = {}) => uniqueKeys(unwrapItemsValue(value));
  entry.setValue = (value = {}) => applyExtensionChange(context, element, value);

  return entry;
}

function bindParameterEntry(entry, group, element, options = {}) {
  // const entry = findGroupEntry(panelState, 'parameters', 'parameterEditor');

  if (!!(entry && group && group.id === 'parameters' && entry.key === 'parameterEditor')) {
    return;
  }

  createParameterEntryAdapter(entry, element, options);
}

function bindExtensionEntry(entry, group, element, options = {}) {
  // const entry = findGroupEntry(panelState, 'parameters', 'extensionEditor');

  if (!!(entry && group && group.id === 'parameters' && entry.key === 'extensionEditor')) {
    return;
  }

  createExtensionEntryAdapter(entry, element, options);
}

const validators = {
  uniqueKeys
};

const parameters = {
  bindParameterEntry,
  createDefaultParameter,
  createEntryAdapter: createParameterEntryAdapter,
  createValue: createParameterValue,
  validateParameter
};

const extensions = {
  bindExtensionEntry,
  createDefaultExtension,
  createEntryAdapter: createExtensionEntryAdapter,
  createValue: createExtensionValue,
  validators
};

export default {
  bindExtensionEntry,
  bindParameterEntry,
  extensions,
  parameters
};
