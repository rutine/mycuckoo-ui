import { getBusinessObject } from 'bpmn/lib/util/ModelUtil';
import { without } from 'min-dash';

import { createElement, getParametersElement, nextId } from '../../../util';
import ParameterProps from './ParameterProps';



export default function ParametersProps({ element, injector }) {
  let parametersElement = getParametersElement(element, 'taskExt:Parameters');

  const parameterElements = (parametersElement && parametersElement.get('values')) || [];
  const bpmnFactory = injector.get('bpmnFactory');
  const commandStack = injector.get('commandStack');
  const translate = injector.get('translate');

  const items = parameterElements.map((parameter, index) => {
    const id = element.id + '-parameter-' + index;

    return {
      id,
      label: parameter.get('name') || '',
      entries: ParameterProps({ parentId: id, element, parameter }),
      autoFocusEntry: id + '-name',
      remove: removeFactory({ element, parameter, commandStack })
    };
  });

  return {
    items,
    translate,
    add: addFactory({ element, commandStack, bpmnFactory, translate })
  };
}

function removeFactory({ element, parameter, commandStack }) {
  return function(event) {
    event.stopPropagation();

    const parametersElement = getParametersElement(element, 'taskExt:Parameters');
    if (!parametersElement) {
      return;
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parametersElement,
      properties: {
        values: without(parametersElement.get('values'), parameter)
      }
    });
  };
}

function addFactory({ element, commandStack, bpmnFactory, translate }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];
    const businessObject = getBusinessObject(element);

    // (1) ensure extension elements
    let extensionElements = businessObject.get('extensionElements');
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

    // (2) ensure parameters extension
    let parametersElement = getParametersElement(element, 'taskExt:Parameters');
    if (!parametersElement) {
      parametersElement = createElement('taskExt:Parameters', { values: [] }, extensionElements, bpmnFactory);
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [ ...extensionElements.get('values'), parametersElement ]
          }
        }
      });
    }

    // (3) create parameter
    const parameterElement = createElement('taskExt:Parameter', { name: nextId(translate('Parameter') + '_'), value: '' }, parametersElement, bpmnFactory);

    // (4) add parameter to list
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: parametersElement,
        properties: {
          values: [ ...parametersElement.get('values'), parameterElement ]
        }
      }
    });

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}