// import MyModeler from './MyModeler'

import MyPaletteProviderModule from './palette';
import MyContextProviderModule from './context-pad';
import IdGeneratorModule from './id-generator';
import MyTranslate from './translate';

import LayuiPropertiesPanelModule from './layui-panel';
import taskModdleDescriptor from './properties-panel/descriptors/taskExt.json';
import userTaskModdleDescriptor from './properties-panel/descriptors/userTask.json';
import layuiPanelApi from './layui-panel/public-api';

export default {
  modules: [
    // MyModeler,
    MyTranslate,
    MyPaletteProviderModule,
    MyContextProviderModule,
    IdGeneratorModule,
    LayuiPropertiesPanelModule
  ],
  moddles: {
    taskExt: taskModdleDescriptor,
    userTask: userTaskModdleDescriptor
  },
  layuiPropertiesPanel: LayuiPropertiesPanelModule,
  layuiPanelApi
};
