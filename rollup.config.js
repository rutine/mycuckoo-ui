import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

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
  }
]
