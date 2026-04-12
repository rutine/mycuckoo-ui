import { SelectEntry, TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function ListenerProps(props) {
  const { parentId, element, extension } = props;
  const entries = [
    {
      id: parentId + '_event',
      component: FlowableEvent,
      extension,
      parentId,
      element
    },
    {
      id: parentId + '_expression',
      component: FlowableExpr,
      extension,
      parentId,
      element
    }
  ];

  return entries;
}

function FlowableEvent(props) {
  const { parentId, element, extension } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const events = {
    assignment: '${auditFlowService.beforeTask(execution)}',
    all: "${auditFlowService.on('test0001', task)}"
  };

  const setValue = (value) => {
    extension.event = value;
    extension.expression = events[value];
    modeling.updateProperties(element, {});
  };

  const getValue = (currentExtension) => {
    return currentExtension.event;
  };

  return SelectEntry({
    id: parentId + '_value',
    element: extension,
    label: translate('Name'),
    getOptions: () => {
      return [
        { label: '任务分派事件', value: 'assignment' },
        { label: '所有事件', value: 'all' }
      ];
    },
    getValue,
    setValue,
    debounce
  });
}

function FlowableExpr(props) {
  const { parentId, element, extension } = props;
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: extension,
      properties: { expression: value }
    });
  };

  const getValue = (currentExtension) => {
    return currentExtension.expression;
  };

  return TextFieldEntry({
    id: parentId + '_value',
    element: extension,
    label: translate('Expression'),
    getValue,
    setValue,
    debounce
  });
}