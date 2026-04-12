import { without } from 'min-dash';
import { getBusinessObject } from 'bpmn/lib/util/ModelUtil';

import { CollapsibleEntry, ListEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import { createElement } from '../../../util';
import ExtensionProps from './ExtensionProps';


export default function ExtensionsProps(props) {
  const { parentId, element, parameter } = props;
  const id = `${ parentId }-extensions`;
  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let extensionsElement = parameter.get('extensions');
  const extensions = (extensionsElement && extensionsElement.get('extensions')) || [];

  return ListEntry({
    id: parentId + '-extensions',
    element: element,
    label: translate('Extensions'),
    translate,
    component: Extension,
    items: extensions,
    autoFocusEntry: `[data-entry-id="${id}-extension-${extensions.length - 1}"] input`,
    onAdd: addExtension({ element, parameter, commandStack, bpmnFactory }),
    onRemove: removeExtension({ element, parameter, commandStack })
  })
}

function addExtension({ element, parameter, commandStack, bpmnFactory }) {
  return function () {
    const commands = [];
    const businessObject = getBusinessObject(element);

    let extensionsElement = parameter.get('extensions');
    // (1) ensure extensions
    if (!extensionsElement) {
      extensionsElement = createElement('taskExt:Extensions', { }, businessObject, bpmnFactory);
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: parameter,
          properties: { extensions: extensionsElement }
        }
      });
    }

    // (2) add extension
    const extensionElement = createElement('taskExt:Extension', { key: undefined }, extensionsElement, bpmnFactory);
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: extensionsElement,
        properties: {
          extensions: [ ...extensionsElement.get('extensions'), extensionElement ]
        }
      }
    });

    // (3) commit updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  }
}

function removeExtension({ element, parameter, commandStack }) {
  return function (extension) {
    const extensionsElement = parameter.get('extensions');
    if (!extensionsElement) {
      return;
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: extensionsElement,
      properties: {
        extensions: without(extensionsElement.get('extensions'), extension)
      }
    });
  }
}

function Extension(props) {
  const { element, id: parentId, index, item: extension, open } = props;
  const translate = useService('translate');
  const id = `${ parentId }-extension-${ index }`;

  return CollapsibleEntry({
    id: id,
    element: element,
    label: extension.get('key') || translate('<empty>'),
    entries: ExtensionProps({ parentId: id, element, extension }),
    translate,
    open
  });
}
