import {
  createElement,
  executeCommands,
  getProperty,
  queryTypedExtensionElement,
  queryTypedExtensionElements,
  updateModdleProperties
} from '../../../ModdleUtils.js';
import {getStr, toStr} from '../../common/utils.js';
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

function createExtensionValue(element) {
  return {
    kind: 'extension-editor',
    scope: 'parameter',
    items: listExtensions(element)
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

function getParameterIndex(value = {}) {
  if (Number.isInteger(value.parameterIndex)) {
    return value.parameterIndex;
  }

  const data = value.value;
  return Number.isInteger(data && data.parameterIndex) ? data.parameterIndex : -1;
}

function getExtensionIndex(value = {}) {
  if (Number.isInteger(value.extensionIndex)) {
    return value.extensionIndex;
  }

  const data =  value.value;
  return Number.isInteger(data && data.extensionIndex) ? data.extensionIndex : -1;
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
  const nextValue = createExtensionProperties(value.value);

  if (action === 'add') {
    return [
      ...items,
      {
        parameterIndex: parameterIndex == -1 ? null : parameterIndex,
        extensionIndex: null,
        ...nextValue
      }
    ];
  } else if (action === 'update') {
    return items.map((item) => (
        item.parameterIndex === parameterIndex && item.extensionIndex === extensionIndex
            ? { ...item, ...nextValue } : item
    ));
  } else if (action === 'remove') {
    return items.filter((item) => !(item.parameterIndex === parameterIndex && item.extensionIndex === extensionIndex));
  }

  return items;
}

function applyExtensionAdd(context, element, value = {}, validation) {
  const parameterIndex = getParameterIndex(value);
  const { values: parameters } = getParametersValues(element);
  const parameter = -1 < parameterIndex && parameterIndex < parameters.length ? parameters[parameterIndex] : null;

  if (!parameter) {
    return { updated: false, reason: 'parameter-not-found', validation };
  }

  const ensured = createDefaultParameterExtensionsElement(context, element, parameter);
  const { values } = getExtensionValues(parameter);
  const newExtension = createElement('taskExt:Extension', createExtensionProperties(value.value), ensured.extensionsElement, context.bpmnFactory);

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
    value: createExtensionValue(element)
  };
}

function applyExtensionUpdate(context, element, value = {}, validation) {
  const parameterIndex = getParameterIndex(value);
  const { values: parameters } = getParametersValues(element);
  const parameter = -1 < parameterIndex && parameterIndex < parameters.length ? parameters[parameterIndex] : null;
  const extensionIndex = getExtensionIndex(value);
  const { values } = getExtensionValues(parameter);

  const extension = -1 < extensionIndex && extensionIndex < values.length ? values[extensionIndex] : null;

  if (!extension) {
    return { updated: false, reason: 'extension-not-found', validation };
  }

  const result = executeCommands(context.commandStack, [{
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: extension,
        properties: createExtensionProperties(value.value)
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

function applyExtensionRemove(context, element, value = {}, validation) {
  const parameterIndex = getParameterIndex(value);
  const { values: parameters } = getParametersValues(element);
  const parameter = -1 < parameterIndex && parameterIndex < parameters.length ? parameters[parameterIndex] : null;
  const extensionIndex = getExtensionIndex(value);
  const { extensionsElement, values } = getExtensionValues(parameter);
  const extension = -1 < extensionIndex && extensionIndex < values.length ? values[extensionIndex] : null;

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
        .map((extension) => createElement('taskExt:Extension', extension, ensured.extensionsElement, context.bpmnFactory))
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
  const nextValue = createParameterProperties(parameter);
  const errors = {};

  if (!getStr(nextValue.name).trim()) {
    errors.name = 'name is required';
  }

  return createValidationResult(errors, 'value', nextValue);
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
    value: parameter
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
    value: parameter
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
    items: listParameters(element)
  };
}

function listParameters(element) {
  const { values } = getParametersValues(element);

  return values.map((parameter, index) => ({
    index,
    ...createParameterProperties({ name: getProperty(parameter, 'name'), value: getProperty(parameter, 'value') })
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
      ...createExtensionProperties({ key: getProperty(extension, 'key') })
    }));
  });
}

function validateExtensions(extensions = []) {
  const nextData = Array.isArray(extensions)
    ? extensions.map((extension) => createExtensionProperties(extension))
    : [];
  const keyIndexes = new Map();

  nextData.forEach((extension, index) => {
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
    extensions: nextData
  };
}

function applyParameterChange(context, element, value = {}) {
  const nextValue = value.value;
  const validation = validateParameter(nextValue);
  const nextIndex = Number.isInteger(value && value.index)
    ? value.index
    : (Number.isInteger(nextValue && nextValue.index) ? nextValue.index : null);

  if (!validation.valid) {
    return { updated: false, validation };
  }

  const result = nextIndex === null
    ? addParameter(context, element, validation.value)
    : updateParameter(context, element, nextIndex, validation.value);

  return {
    ...result,
    validation
  };
}

function applyExtensionChange(context, element, value = {}) {
  const action = getStr(value.action);
  const nextItems = action ? getNextExtensionItemsForAction(element, value) : unwrapItemsValue(value);
  const validation = validateExtensions(nextItems);

  if (!validation.valid) {
    return { updated: false, validation };
  }

  switch (action) {
    case 'add':
      return applyExtensionAdd(context, element, value, validation);
    case 'update':
      return applyExtensionUpdate(context, element, value, validation);
    case 'remove':
      return applyExtensionRemove(context, element, value, validation);
    default:
      if (Array.isArray(nextItems)) {
        return applyExtensionListReplacement(context, element, value, validation);
      }

      return {updated: false, reason: 'unsupported-action', validation};
  }
}

function createParameterEntryAdapter(entry, element, options = {}) {
  const context = options.context || null;
  if (!entry) {
    return entry;
  }

  entry.getValue = () => createParameterValue(element);
  entry.validate = (value = {}) => validateParameter(value.value);
  entry.setValue = (value = {}) => applyParameterChange(context, element, value);

  return entry;
}

function createExtensionEntryAdapter(entry, element, options = {}) {
  const context = options.context || null;
  if (!entry) {
    return entry;
  }

  entry.getValue = () => createExtensionValue(element);
  entry.validate = (value = {}) => validateExtensions(value.values);
  entry.setValue = (value = {}) => applyExtensionChange(context, element, value);

  return entry;
}

function bindParameterEntry(entry, group, element, options = {}) {
  if (!!(entry && group && group.id === 'parameters' && entry.key === 'parameterEditor')) {
    return;
  }

  createParameterEntryAdapter(entry, element, options);
}

function bindExtensionEntry(entry, group, element, options = {}) {
  if (!(entry && group && group.id === 'parameters' && entry.key === 'extensionEditor')) {
    return;
  }

  createExtensionEntryAdapter(entry, element, options);
}


export default {
  bindExtensionEntry,
  bindParameterEntry
};
