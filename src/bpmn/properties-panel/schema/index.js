import {
  createEmptyPanelSchema,
  createPanelSchema,
  createSimpleEntry,
  createSwitchEntry,
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

const PROCESS_GROUPS = [
  {
    id: 'base',
    label: '模型信息',
    entries: [
      createSimpleEntry('id', '模型ID'),
      createSimpleEntry('name', '模型名称'),
      createSwitchEntry('isExecutable', '是否可执行', {
        layText: '是|否',
        getValue: (element) => {
          const businessObject = element && element.businessObject ? element.businessObject : {};
          return businessObject.isExecutable !== false;
        },
        normalizeValue: (value) => value === true || String(value) === 'true'
      })
    ]
  }
];

const SCHEMA_ROUTES = {
  'bpmn:Process': (element) => createPanelSchema(element, PROCESS_GROUPS),
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
