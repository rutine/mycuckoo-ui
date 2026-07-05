import Ids from 'ids';

export function getBusinessObject(element) {
  if (!element) {
    return null;
  }

  return element.businessObject || element;
}

export function queryTypedExtensionElements(element, type) {
  const businessObject = getBusinessObject(element);
  if (!businessObject  || !businessObject.extensionElements || !businessObject.extensionElements.values) {
    return [];
  }

  let values = businessObject.extensionElements.values;
  values = Array.isArray(values) ? values : (!!values ? [values] : []);
  if (type === 'all') {
    return values;
  }

  return values.filter(function(value) {
    // return value.$type === 'flowable:TaskListener';
    return value.$instanceOf(type);
  });
}

export function queryTypedExtensionElement(element, type) {
  const typedElements = queryTypedExtensionElements(element, type);
  return typedElements.length > 0 ? typedElements[0] : null;
}

export function createElement(elementType, properties, parent, factory) {
  const element = factory.create(elementType, properties);

  if (parent) {
    element.$parent = parent;
  }

  return element;
}

export function getProperty(obj, key) {
  if (!obj || !key) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }

  if (typeof obj.get === 'function') {
    return obj.get(key);
  }

  return undefined;
}

export function getExpressionBody(expression) {
  if (!expression) {
    return '';
  }

  return expression.body || expression.value || '';
}

export function executeCommands(commandStack, commands = []) {
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

export function updateModdleProperties(commandStack, element, moddleElement, properties = {}) {
  return commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement,
    properties
  });
}


export function nextId(prefix) {
  const ids = new Ids([ 32,32,1 ]);

  return ids.nextPrefixed(prefix);
}

export function getNumericSuffix(value, prefix) {
  if (!value || !value.startsWith(prefix)) {
    return null;
  }

  const suffix = value.slice(prefix.length);

  return /^\d+$/.test(suffix) ? Number(suffix) : null;
}

export function getNextIndexedValue(prefix, values) {
  let maxIndex = -1;

  (values || []).forEach((value) => {
    const index = getNumericSuffix(value, prefix);

    if (index !== null && index > maxIndex) {
      maxIndex = index;
    }
  });

  return `${prefix}${maxIndex + 1}`;
}

export function getNextElementId(prefix, elementRegistry) {
  const ids = (elementRegistry && elementRegistry.getAll ? elementRegistry.getAll() : []).map((element) => element.id);

  return getNextIndexedValue(prefix, ids);
}

export function getTaskIndex(value) {
  return getNumericSuffix(value, 'task_');
}

export function hasTaskId(value) {
  return getTaskIndex(value) !== null;
}

export function getNextTaskId(elementRegistry) {
  return getNextElementId('task_', elementRegistry);
}

export function getTaskCollectionName(taskIndex) {
  return `assigneeList_${taskIndex === null ? 0 : taskIndex}`;
}

export function getTaskIndexFromElement(element) {
  const businessObject = getBusinessObject(element);

  return getTaskIndexFromBusinessObject(businessObject);
}

function getTaskIndexFromBusinessObject(businessObject) {
  if (!businessObject) {
    return null;
  }

  const currentIndex = getTaskIndex(businessObject.id);

  if (currentIndex !== null) {
    return currentIndex;
  }

  const incomingIndex = getTaskIndexFromConnections(businessObject.incoming, 'sourceRef', 'auditGateway_');

  if (incomingIndex !== null) {
    return incomingIndex;
  }

  return getTaskIndexFromConnections(businessObject.outgoing, 'targetRef', 'shortOutGateway_');
}

function getTaskIndexFromConnections(connections, endpointKey, prefix) {
  for (const connection of connections || []) {
    const endpoint = connection && connection[endpointKey];

    if (!endpoint || !endpoint.id) {
      continue;
    }

    const index = getNumericSuffix(endpoint.id, prefix);

    if (index !== null) {
      return index;
    }
  }

  return null;
}
