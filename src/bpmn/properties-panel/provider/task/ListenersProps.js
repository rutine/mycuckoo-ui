import { without } from 'min-dash';
import { getBusinessObject } from 'bpmn/lib/util/ModelUtil';

import { CollapsibleEntry, ListEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import { createElement } from '../../../util';

import ListenerProps from './ListenerProps';

export default function ListenersProps(props) {
  const { parentId, element } = props;
  const id = `${ parentId }_listeners`;
  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let extensionElements = getBusinessObject(element).get('extensionElements');
  const listeners = ((extensionElements && extensionElements.get('values')) || [])
    .filter((item) => item.$type === 'flowable:TaskListener');

  return ListEntry({
    id: id,
    element: element,
    label: translate('Extensions'),
    translate,
    component: Extension,
    items: listeners,
    autoFocusEntry: `[data-entry-id="${id}-listener-${listeners.length - 1}"] input`,
    onAdd: addListener({ element, commandStack, bpmnFactory }),
    onRemove: removeListener({ element, commandStack })
  })
}

function addListener({ element, commandStack, bpmnFactory }) {
  return function () {
    const commands = [];
    const businessObject = getBusinessObject(element);

    let extensionElements = businessObject.get('extensionElements');;
    // (1) ensure extensions
    if (!extensionElements) {
      extensionElements = createElement('bpmn:ExtensionElements', { values: [] }, businessObject, bpmnFactory);
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject,
          properties: { extensionElements }
        }
      });
    }

    // (2) add extension
    const extensionElement = createElement('flowable:TaskListener', { event: 'assignment', expression: '${auditFlowService.beforeTask(execution)}' }, extensionElements, bpmnFactory);
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: extensionElements,
        properties: {
          values: [ ...extensionElements.get('values'), extensionElement ]
        }
      }
    });

    // (3) commit updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  }
}

function removeListener({ element, commandStack }) {
  return function (extension) {
    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject.get('extensionElements');
    if (!extensionElements) {
      return;
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: extensionElements,
      properties: {
        values: without(extensionElements.get('values'), extension)
      }
    });
  }
}

function Extension(props) {
  const { element, id: parentId, index, item: extension, open } = props;
  const translate = useService('translate');
  const id = `${ parentId }_listener_${ index }`;

  return CollapsibleEntry({
    id: id,
    element: element,
    label: translate('Listeners'),
    entries: ListenerProps({ parentId: id, element, extension }),
    translate,
    open
  });
}
