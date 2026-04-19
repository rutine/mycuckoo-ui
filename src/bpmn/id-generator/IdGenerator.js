import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

import { getNextIndexedValue, getNumericSuffix, getTaskIndex, hasTaskId } from '../util';

export default function IdGenerator(eventBus, modeling, elementRegistry) {
  let syncing = false;

  eventBus.on('commandStack.changed', 1200, function() {
    if (syncing || !elementRegistry || !elementRegistry.getAll) {
      return;
    }

    syncing = true;

    try {
      const elements = elementRegistry.getAll();

      normalizeTaskIds(elements, modeling);
      normalizeGatewayIds(elements, modeling, elementRegistry);
      normalizeSequenceFlowIds(elements, modeling, elementRegistry);
    } finally {
      syncing = false;
    }
  });
}

IdGenerator.$inject = [ 'eventBus', 'modeling', 'elementRegistry' ];

function normalizeTaskIds(elements, modeling) {
  const reservedIds = new Set(
    elements
      .map((element) => element && element.id)
      .filter((id) => hasTaskId(id))
  );

  elements
    .filter((element) => is(element, 'bpmn:Task'))
    .forEach((element) => {
      if (hasTaskId(element.id)) {
        return;
      }

      const nextId = getNextIndexedValue('task_', [ ...reservedIds ]);

      reservedIds.add(nextId);
      modeling.updateProperties(element, { id: nextId });
    });
}

function normalizeGatewayIds(elements, modeling, elementRegistry) {
  const reservedIds = new Set(
    elementRegistry.getAll()
      .map((element) => element && element.id)
      .filter(Boolean)
  );

  elements
    .filter((element) => is(element, 'bpmn:ExclusiveGateway'))
    .forEach((element) => {
      const nextId = getGatewayId(element, reservedIds);

      if (!nextId || nextId === element.id) {
        return;
      }

      reservedIds.delete(element.id);
      reservedIds.add(nextId);

      modeling.updateProperties(element, { id: nextId });
    });
}

function normalizeSequenceFlowIds(elements, modeling, elementRegistry) {
  const reservedIds = new Set(
    elementRegistry.getAll()
      .map((element) => element && element.id)
      .filter(Boolean)
  );

  elements
    .filter((element) => is(element, 'bpmn:SequenceFlow'))
    .forEach((element) => {
      const nextId = getSequenceFlowId(element, reservedIds);

      if (!nextId || nextId === element.id) {
        return;
      }

      reservedIds.delete(element.id);
      reservedIds.add(nextId);

      modeling.updateProperties(element, { id: nextId });
    });
}

function getGatewayId(element, reservedIds) {
  const gatewayInfo = getGatewayInfo(element);

  if (!gatewayInfo) {
    return null;
  }

  const nextId = `${gatewayInfo.prefix}_${gatewayInfo.index}`;

  if (reservedIds.has(nextId) && nextId !== element.id) {
    return null;
  }

  return nextId;
}

function getGatewayInfo(element) {
  const outgoing = getConnections(element, 'outgoing');

  for (const connection of outgoing) {
    const target = getConnectionEndpoint(connection, 'target');
    const taskIndex = getTaskIndex(target && target.id);

    if (taskIndex !== null) {
      return {
        prefix: 'shortOutGateway',
        index: taskIndex
      };
    }
  }

  const incoming = getConnections(element, 'incoming');

  for (const connection of incoming) {
    const source = getConnectionEndpoint(connection, 'source');
    const taskIndex = getTaskIndex(source && source.id);

    if (taskIndex !== null) {
      return {
        prefix: 'auditGateway',
        index: taskIndex
      };
    }
  }

  return null;
}

function getConnections(element, key) {
  const businessObject = getBusinessObject(element);
  const connections = businessObject && businessObject[key];

  return Array.isArray(connections) ? connections : [];
}

function getConnectionEndpoint(connection, key) {
  if (!connection) {
    return null;
  }

  if (connection[key]) {
    return connection[key];
  }

  const businessObject = getBusinessObject(connection);

  if (!businessObject) {
    return null;
  }

  return key === 'source' ? businessObject.sourceRef : businessObject.targetRef;
}

function getSequenceFlowId(element, reservedIds) {
  const baseId = getSequenceFlowBaseId(element);

  if (!baseId) {
    return null;
  }

  if (!reservedIds.has(baseId) || baseId === element.id) {
    return baseId;
  }

  let index = 1;
  let candidateId = `${baseId}_${index}`;

  while (reservedIds.has(candidateId) && candidateId !== element.id) {
    index += 1;
    candidateId = `${baseId}_${index}`;
  }

  return candidateId;
}

function getSequenceFlowBaseId(element) {
  const businessObject = getBusinessObject(element);
  const sourceRef = businessObject.sourceRef;
  const targetRef = businessObject.targetRef;

  if (!sourceRef || !sourceRef.id || !targetRef || !targetRef.id) {
    return null;
  }

  return `${sourceRef.id}_to_${targetRef.id}`;
}
