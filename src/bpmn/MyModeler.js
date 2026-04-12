import inherits from 'inherits-browser'

import Modeler from 'bpmn/lib/Modeler'

// import MyPaletteProvider from './palette'

export default function MyModeler(options) {
  Modeler.call(this, options)
}

inherits(MyModeler, Modeler)

// MyModeler.prototype._modules = [].concat(
//   Modeler.prototype._modules,
//   [
//     MyPaletteProvider
//   ]
// );

