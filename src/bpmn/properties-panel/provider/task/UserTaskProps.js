import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';

import ListenersProps from './ListenersProps';

export default function UserTaskProps({ element, injector }) {
  const modeling = injector.get('modeling');
  const businessObject = element.businessObject;
  const properties = {};

  if (!businessObject.name) {
    properties.name = '审核节点';
  }

  if (!businessObject.get('flowable:assignee')) {
    properties['flowable:assignee'] = '${assignee}';
  }

  if (Object.keys(properties).length) {
    modeling.updateProperties(element, properties);
  }

  const parentId = element.id;

  return [
    {
      id: parentId + '_task',
      component: Task,
      parentId
    },
    {
      id: parentId + '_assignee',
      component: Assignee,
      parentId
    },
    {
      id: parentId + '_formKey',
      component: FormKey,
      parentId
    },
    {
      id: parentId + '_listeners',
      component: ListenersProps,
      parentId
    }
  ];
}

function Task(props) {
  const { parentId, element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = (currentElement) => {
    return currentElement.businessObject.name || '';
  };

  const setValue = (value) => {
    return modeling.updateProperties(element, { name: value });
  };

  return TextFieldEntry({
    id: parentId + '_name',
    element,
    label: translate('Name'),
    getValue,
    setValue,
    debounce
  });
}

function FormKey(props) {
  const { parentId, element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = (currentElement) => {
    return currentElement.businessObject.get('flowable:formKey') || '';
  };

  const setValue = (value) => {
    return modeling.updateProperties(element, {
      'flowable:formKey': value || undefined
    });
  };

  return TextFieldEntry({
    id: parentId + '_value',
    element,
    label: translate('Form Key'),
    getValue,
    setValue,
    debounce
  });
}

function Assignee(props) {
  const { parentId, element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = (currentElement) => {
    return currentElement.businessObject.get('flowable:assignee') || '';
  };

  const setValue = (value) => {
    return modeling.updateProperties(element, {
      'flowable:assignee': value || undefined
    });
  };

  return TextFieldEntry({
    id: parentId + '_value',
    element,
    label: translate('Assignee'),
    getValue,
    setValue,
    debounce
  });
}
