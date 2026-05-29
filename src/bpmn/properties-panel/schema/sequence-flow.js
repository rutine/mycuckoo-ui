import {
  COMPONENTS,
  createPanelSchema,
  createSimpleEntry
} from './common.js';

const SEQUENCE_FLOW_GROUPS = [
  {
    id: 'base',
    label: '基础信息',
    entries: [
      createSimpleEntry('name', '连线名称'),
      createSimpleEntry('id', '连线ID')
    ]
  },
  {
    id: 'flow-condition',
    label: '流转条件',
    entries: [
      createSimpleEntry('conditionExpression', '流转条件', {
        component: COMPONENTS.EXPRESSION_EDITOR
      })
    ]
  }
];

export function resolveSequenceFlowSchema(element) {
  return createPanelSchema(element, SEQUENCE_FLOW_GROUPS);
}

export default resolveSequenceFlowSchema;
