import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import ExtensionsProps from './ExtensionsProps';


export default function ParameterProps(props) {
  const { parentId, parameter } = props;
  const entries = [
    {
      id: parentId + '-name',
      component: Name,
      parentId,
      parameter
    },
    {
      id: parentId + '-value',
      component: Value,
      parentId,
      parameter
    },
    {
      id: parentId + '-extensions',
      component: ExtensionsProps,
      parentId,
      parameter
    }
  ];

  return entries;
}

function Name(props) {
  const { parentId, element, parameter } = props;
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        name: value
      }
    });
  };

  const getValue = (parameter) => {
    return parameter.name;
  };

  return TextFieldEntry({
    id: parentId + '-name',
    element: parameter,
    label: translate('Name'),
    getValue,
    setValue,
    debounce
  });
}

function Value(props) {
  const { parentId, element, parameter } = props;
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        value: value
      }
    });
  };

  const getValue = (parameter) => {
    return parameter.value;
  };

  return TextFieldEntry({
    id: parentId + '-value',
    element: parameter,
    label: translate('Value'),
    getValue,
    setValue,
    debounce
  });
}