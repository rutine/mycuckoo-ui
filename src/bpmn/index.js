// import MyModeler from './MyModeler'

import MyPaletteProviderModule from './palette';
import MyContextProviderModule from './context-pad';
import IdGeneratorModule from './id-generator';
import MyTranslate from './translate';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule
} from 'bpmn-js-properties-panel';

import userPropertiesProviderModule from './properties-panel/provider';
import propertiesPanelI18nModule from './properties-panel/i18n';
import taskModdleDescriptor from './properties-panel/descriptors/taskExt.json';
import userTaskModdleDescriptor from './properties-panel/descriptors/userTask.json';


export default {
  modules: [
    // MyModeler,
    MyTranslate,
    MyPaletteProviderModule,
    MyContextProviderModule,
    IdGeneratorModule,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    propertiesPanelI18nModule,
    userPropertiesProviderModule
  ],
  moddles: {
    taskExt: taskModdleDescriptor,
    userTask: userTaskModdleDescriptor
  }
}
