// import MyModeler from './MyModeler'

import MyPaletteProviderModule from './palette';
import MyContextProviderModule from './context-pad';
import IdGeneratorModule from './id-generator';
import MyTranslate from './translate';

import taskModdleDescriptor from './properties-panel/descriptors/taskExt.json';
import userTaskModdleDescriptor from './properties-panel/descriptors/userTask.json';
import MyPropertiesPanelModule from './properties-panel';
import myPanelApi from './properties-panel/public-api';

export default {
  modules: [
    // MyModeler,
    MyTranslate,
    MyPaletteProviderModule,
    MyContextProviderModule,
    IdGeneratorModule,
    MyPropertiesPanelModule
  ],
  moddles: {
    taskExt: taskModdleDescriptor,
    userTask: userTaskModdleDescriptor
  },
  myPropertiesPanel: MyPropertiesPanelModule,
  myPanelApi
};
