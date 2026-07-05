import {
  createEmptyPanelSetting,
  createPanelSetting,
  createSimpleEntry,
  createSwitchEntry,
  getElementType
} from './BasicSetting.js';
import { createSequenceFlowSetting } from './SequenceFlowSetting.js';
import { createUserTaskSetting } from './UserTaskSetting.js';

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
  'bpmn:Process': (element) => createPanelSetting(element, PROCESS_GROUPS),
  'bpmn:SequenceFlow': createSequenceFlowSetting,
  'bpmn:UserTask': createUserTaskSetting
};

function resolvePanelSetting(element) {
  if (!element) {
    return createEmptyPanelSetting();
  }

  const elementType = getElementType(element);
  const resolver = SCHEMA_ROUTES[elementType];

  if (resolver) {
    return resolver(element);
  }

  return createPanelSetting(element, FALLBACK_GROUPS);
}

export default resolvePanelSetting;
