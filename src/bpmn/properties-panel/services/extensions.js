import {
  createElement,
  getParametersElement,
  readModdleProperty
} from '../../util.js';

export function updateModdleProperties(commandStack, element, moddleElement, properties = {}) {
  return commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement,
    properties
  });
}

function executeCommands(commandStack, commands = []) {
  if (!commandStack || !Array.isArray(commands) || !commands.length) {
    return undefined;
  }

  if (commands.length === 1) {
    return commandStack.execute(commands[0].cmd, commands[0].context);
  }

  try {
    return commandStack.execute('properties-panel.multi-command-executor', commands);
  } catch (error) {
    let lastResult;

    commands.forEach((command) => {
      lastResult = commandStack.execute(command.cmd, command.context);
    });

    return lastResult;
  }
}

function resolveFactory(services = {}) {
  return services.bpmnFactory || services.moddle || null;
}

function createModdleElement(services, type, properties = {}, parent = null) {
  const factory = resolveFactory(services);

  if (!factory || typeof factory.create !== 'function') {
    return null;
  }

  return createElement(type, properties, parent, factory);
}

export function ensureExtensionElements(services, element) {
  const businessObject = element && element.businessObject ? element.businessObject : null;
  let extensionElements = businessObject && (
    businessObject.extensionElements || (
      typeof businessObject.get === 'function' ? businessObject.get('extensionElements') : null
    )
  );

  if (extensionElements || !businessObject || !services || !services.commandStack) {
    return extensionElements;
  }

  extensionElements = createModdleElement(services, 'bpmn:ExtensionElements', { values: [] }, businessObject);

  if (!extensionElements) {
    return null;
  }

  updateModdleProperties(services.commandStack, element, businessObject, {
    extensionElements
  });

  return extensionElements;
}

export function ensureTaskParameters(services, element) {
  const extensionElements = ensureExtensionElements(services, element);
  let parametersElement = getParametersElement(element, 'taskExt:Parameters');

  if (parametersElement || !extensionElements || !services || !services.commandStack) {
    return parametersElement;
  }

  const values = readModdleProperty(extensionElements, 'values');
  const nextValues = Array.isArray(values) ? values : [];

  parametersElement = createModdleElement(services, 'taskExt:Parameters', { values: [] }, extensionElements);

  if (!parametersElement) {
    return null;
  }

  updateModdleProperties(services.commandStack, element, extensionElements, {
    values: [ ...nextValues, parametersElement ]
  });

  return parametersElement;
}

function normalizeParameterName(name) {
  return typeof name === 'string' ? name.trim() : '';
}

function normalizeParameterValue(value) {
  return typeof value === 'string' ? value : '';
}

function listTaskParameters(element) {
  const parametersElement = getParametersElement(element, 'taskExt:Parameters');
  const values = readModdleProperty(parametersElement, 'values');

  return {
    parametersElement,
    values: Array.isArray(values) ? values : []
  };
}

function findTaskParameter(element, name) {
  const normalizedName = normalizeParameterName(name);
  const { parametersElement, values } = listTaskParameters(element);
  const index = values.findIndex((parameter) => normalizeParameterName(readModdleProperty(parameter, 'name')) === normalizedName);

  return {
    parametersElement,
    values,
    index,
    parameter: index >= 0 ? values[index] : null
  };
}

export function getTaskParameterValue(element, name, fallback = '') {
  const { parameter } = findTaskParameter(element, name);
  const value = parameter ? readModdleProperty(parameter, 'value') : fallback;

  return typeof value === 'string' ? value : fallback;
}

export function upsertTaskParameter(services, element, name, value = '') {
  if (!services || !services.commandStack) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-services'
    };
  }

  const normalizedName = normalizeParameterName(name);
  const normalizedValue = normalizeParameterValue(value);

  if (!normalizedName) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-parameter-name'
    };
  }

  const existing = findTaskParameter(element, normalizedName);

  if (!existing.parameter) {
    return appendTaskParameter(services, element, {
      name: normalizedName,
      value: normalizedValue
    });
  }

  const result = updateModdleProperties(services.commandStack, element, existing.parameter, {
    name: normalizedName,
    value: normalizedValue
  });

  return {
    updated: true,
    result,
    parameter: existing.parameter,
    parametersElement: existing.parametersElement
  };
}

export function removeTaskParameter(services, element, name) {
  if (!services || !services.commandStack) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-services'
    };
  }

  const existing = findTaskParameter(element, name);

  if (!existing.parameter || !existing.parametersElement) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-parameter'
    };
  }

  const nextValues = existing.values.filter((parameter, index) => index !== existing.index);
  const result = updateModdleProperties(services.commandStack, element, existing.parametersElement, {
    values: nextValues
  });

  return {
    updated: true,
    result,
    parametersElement: existing.parametersElement
  };
}

export function appendTaskParameter(services, element, parameter = {}) {
  if (!services || !services.commandStack) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-services'
    };
  }

  const businessObject = element && element.businessObject ? element.businessObject : null;
  let extensionElements = businessObject && (
    businessObject.extensionElements || (
      typeof businessObject.get === 'function' ? businessObject.get('extensionElements') : null
    )
  );
  let parametersElement = getParametersElement(element, 'taskExt:Parameters');
  const commands = [];

  if (!businessObject) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-business-object'
    };
  }

  if (!extensionElements) {
    extensionElements = createModdleElement(services, 'bpmn:ExtensionElements', { values: [] }, businessObject);

    if (!extensionElements) {
      return {
        updated: false,
        notApplied: true,
        reason: 'missing-extension-factory'
      };
    }

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: businessObject,
        properties: {
          extensionElements
        }
      }
    });
  }

  if (!parametersElement) {
    const values = readModdleProperty(extensionElements, 'values');
    const nextValues = Array.isArray(values) ? values : [];

    parametersElement = createModdleElement(services, 'taskExt:Parameters', { values: [] }, extensionElements);

    if (!parametersElement) {
      return {
        updated: false,
        notApplied: true,
        reason: 'missing-task-parameters'
      };
    }

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: extensionElements,
        properties: {
          values: [ ...nextValues, parametersElement ]
        }
      }
    });
  }

  const values = readModdleProperty(parametersElement, 'values');
  const nextValues = Array.isArray(values) ? values : [];
  const parameterElement = createModdleElement(services, 'taskExt:Parameter', {
    name: typeof parameter.name === 'string' ? parameter.name : '',
    value: typeof parameter.value === 'string' ? parameter.value : ''
  }, parametersElement);

  if (!parameterElement) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-parameter-factory'
    };
  }

  commands.push({
    cmd: 'element.updateModdleProperties',
    context: {
      element,
      moddleElement: parametersElement,
      properties: {
        values: [ ...nextValues, parameterElement ]
      }
    }
  });

  const result = commands.length === 1
    ? updateModdleProperties(
      services.commandStack,
      element,
      parametersElement,
      {
        values: [ ...nextValues, parameterElement ]
      }
    )
    : executeCommands(services.commandStack, commands);

  return {
    updated: true,
    result,
    parameter: parameterElement,
    parametersElement
  };
}

export function updateTaskParameter(services, element, index, parameter = {}) {
  if (!services || !services.commandStack) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-services'
    };
  }

  const parametersElement = getParametersElement(element, 'taskExt:Parameters');
  const values = readModdleProperty(parametersElement, 'values');
  const parameterElement = Array.isArray(values) ? values[index] : null;

  if (!parameterElement) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-parameter'
    };
  }

  const result = updateModdleProperties(services.commandStack, element, parameterElement, {
    name: typeof parameter.name === 'string' ? parameter.name : '',
    value: typeof parameter.value === 'string' ? parameter.value : ''
  });

  return {
    updated: true,
    result,
    parameter: parameterElement,
    parametersElement
  };
}

export function createFormalExpression(moddle, parent, body) {
  if (!body) {
    return undefined;
  }

  const expression = moddle.create('bpmn:FormalExpression', {
    body
  });

  if (parent) {
    expression.$parent = parent;
  }

  return expression;
}

export function ensureSequenceFlowConditionExpression(services, element) {
  const businessObject = element && element.businessObject ? element.businessObject : null;
  let conditionExpression = businessObject && (
    businessObject.conditionExpression || (
      typeof businessObject.get === 'function' ? businessObject.get('conditionExpression') : null
    )
  );

  if (conditionExpression || !services || !services.moddle || !services.modeling || !businessObject) {
    return conditionExpression;
  }

  conditionExpression = createFormalExpression(services.moddle, businessObject, '');

  if (!conditionExpression) {
    conditionExpression = services.moddle.create('bpmn:FormalExpression', { body: '' });
    conditionExpression.$parent = businessObject;
  }

  services.modeling.updateProperties(element, {
    conditionExpression
  });

  return conditionExpression;
}

export function updateSequenceFlowConditionExpression(services, element, body = '') {
  if (!services || !services.commandStack) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-services'
    };
  }

  const conditionExpression = ensureSequenceFlowConditionExpression(services, element);

  if (!conditionExpression) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-condition-expression'
    };
  }

  const result = updateModdleProperties(
    services.commandStack,
    element,
    conditionExpression,
    {
      body: typeof body === 'string' ? body : ''
    }
  );

  return {
    updated: true,
    result,
    conditionExpression
  };
}
