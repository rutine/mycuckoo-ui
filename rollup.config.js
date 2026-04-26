import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

const mycuckooEntry = 'mycuckoo-entry';

function mycuckooBundleEntry() {
  return {
    name: 'mycuckoo-bundle-entry',
    resolveId(id) {
      if (id === mycuckooEntry) {
        return id;
      }
    },
    load(id) {
      if (id === mycuckooEntry) {
        return [
          "import { installMyCuckoo } from './src/mycuckoo.js';",
          "import { installMyCuckooApi } from './src/mycuckoo.api.js';",
          "import { installUserPicker } from './src/user-picker.js';",
          '',
          'installMyCuckoo(window);',
          'installUserPicker(window);',
          'installMyCuckooApi(window);',
          ''
        ].join('\n');
      }
    }
  }
}

export default [
  {
    input: './src/bpmn/index.js',
    output: {
      name: 'ModelerPlugins',
      file: './static/bpmn/modeler-plugins.js',
      format: 'umd'
      // format: 'iife'
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      json(),
    ]
  },
  {
    input: mycuckooEntry,
    output: {
      file: './static/mycuckoo.bundle.js',
      format: 'iife',
      name: 'MyCuckooBundle'
    },
    plugins: [
      mycuckooBundleEntry(),
      nodeResolve(),
      commonjs(),
    ]
  }
]
