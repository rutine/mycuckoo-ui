import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function ExtensionProps(props) {
  const { parentId, element, extension } = props;
  const entries = [
    {
      id: parentId + '-key',
      component: Key,
      extension,
      parentId,
      element
    }
  ];

  return entries;
}

function Key(props) {
  const { parentId, element, extension } = props;
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: extension,
      properties: {
        key: value
      }
    });
  };

  const getValue = (extension) => {
    return extension.key;
  };

  return TextFieldEntry({
    id: parentId + '-key',
    element: extension,
    label: translate('Key'),
    getValue,
    setValue,
    debounce
  });
}