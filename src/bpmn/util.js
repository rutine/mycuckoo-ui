import Ids from 'ids';
import { getBusinessObject } from 'bpmn/lib/util/ModelUtil';

export function getParametersElement(element, type) {
  const businessObject = getBusinessObject(element);

  if (!businessObject.extensionElements) {
    return null;
  }

  return businessObject.extensionElements.values.filter(function(e) {
    return e.$instanceOf(type);
  })[0];
}

export function createElement(elementType, properties, parent, factory) {
  const element = factory.create(elementType, properties);

  if (parent) {
    element.$parent = parent;
  }

  return element;
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
