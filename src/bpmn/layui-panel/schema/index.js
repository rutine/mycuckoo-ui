import {
  createEmptyPanelSchema,
  createPanelSchema,
  createSimpleEntry,
  getElementType
} from './common.js';
import { resolveSequenceFlowSchema } from './sequence-flow.js';
import { resolveUserTaskSchema } from './user-task.js';

const FALLBACK_GROUPS = [
  {
    id: 'base',
    label: '基础信息',
    entries: [
      createSimpleEntry('name', '节点名称'),
      createSimpleEntry('id', '节点ID')
    ]
  }
];

const SCHEMA_ROUTES = {
  'bpmn:SequenceFlow': resolveSequenceFlowSchema,
  'bpmn:UserTask': resolveUserTaskSchema
};

export function resolvePanelSchema(element) {
  if (!element) {
    return createEmptyPanelSchema();
  }

  const elementType = getElementType(element);
  const resolver = SCHEMA_ROUTES[elementType];

  if (resolver) {
    return resolver(element);
  }

  return createPanelSchema(element, FALLBACK_GROUPS);
}

export default resolvePanelSchema;
