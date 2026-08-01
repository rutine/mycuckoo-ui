import inherits from 'inherits-browser'
import Viewer from "bpmn-js/lib/Viewer";

import ZoomScrollModule from "diagram-js/lib/navigation/zoomscroll";
import MoveCanvasModule from "diagram-js/lib/navigation/movecanvas";

export default function MyViewer(options) {
    Viewer.call(this, options);
}

inherits(MyViewer, Viewer);

MyViewer.prototype._modules = [].concat(Viewer.prototype._modules, [ZoomScrollModule, MoveCanvasModule]);
