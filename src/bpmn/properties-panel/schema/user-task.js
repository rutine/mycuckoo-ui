import {
  COMPONENTS,
  createBlockEntry,
  createPanelSchema,
  createSimpleEntry
} from './common.js';

const USER_TASK_GROUPS = [
  {
    id: 'base',
    label: '基础信息',
    entries: [
      createSimpleEntry('name', '节点名称'),
      createSimpleEntry('id', '节点ID')
    ]
  },
  {
    id: 'execution',
    label: '执行设置',
    entries: [
      createSimpleEntry('flowable:assignee', '办理人'),
      createSimpleEntry('flowable:formKey', '表单Key')
    ]
  },
  {
    id: 'multi-instance',
    label: '多实例',
    entries: [
      createBlockEntry('multiInstanceEditor', '多实例', COMPONENTS.MULTI_INSTANCE_EDITOR)
    ]
  },
  {
    id: 'listeners',
    label: '监听器',
    entries: [
      createBlockEntry('listenerEditor', '监听器', COMPONENTS.LISTENER_EDITOR)
    ]
  },
  {
    id: 'parameters',
    label: '输入输出',
    entries: [
      createBlockEntry('parameterEditor', '输入输出', COMPONENTS.PARAMETER_EDITOR),
      createBlockEntry('extensionEditor', '扩展属性', 'ExtensionEditor')
    ]
  }
];

export function resolveUserTaskSchema(element) {
  return createPanelSchema(element, USER_TASK_GROUPS);
}

export default resolveUserTaskSchema;
