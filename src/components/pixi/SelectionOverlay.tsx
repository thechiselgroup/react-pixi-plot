import { CustomPIXIComponent, Behavior } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';

interface Props {
  selectionRectangle: PIXI.Rectangle;
  viewRectangle: PIXI.Rectangle;
  invert: boolean;
}

const TYPE = 'SelectionOverlay';
const background = 0xFFFFFF;
const backgroundAlpha = 0.6;
const lineWidth = 2;
const lineColor = 0xCCCCCC;

const behavior: Behavior<Props, PIXI.Container> = {
  customDisplayObject: () => new PIXI.Container(),
  customApplyProps(container, _oldProps, newProps) {
    container.removeChildren();
    const {
      selectionRectangle: { left, top, bottom, right, width, height },
      viewRectangle,
      invert,
    } = newProps;
    const selectionOverlay = new PIXI.Graphics(true);

    // Fade everything that is not selected.
    selectionOverlay.beginFill(background, backgroundAlpha);

    if (!invert) {
      selectionOverlay.drawRect(
        viewRectangle.left,
        viewRectangle.top,
        viewRectangle.width,
        top - viewRectangle.top ,
      ); // top rectangle
      selectionOverlay.drawRect(
        viewRectangle.left,
        bottom,
        viewRectangle.width,
        viewRectangle.height - (bottom - viewRectangle.top),
        ); // bottom rectangle
      selectionOverlay.drawRect(
        viewRectangle.left,
        top,
        left - viewRectangle.left,
        height,
        ); // left rectangle
      selectionOverlay.drawRect(
        right,
        top,
        viewRectangle.width - (right - viewRectangle.left),
        height,
      ); // right rectangle
    } else {
      selectionOverlay.drawRect(left, top, width , height);
    }
    selectionOverlay.endFill();

    selectionOverlay.lineStyle(lineWidth, lineColor);
    selectionOverlay.drawRect(left, top, width, height);
    container.addChild(selectionOverlay);
  },
};

const SelectionOverlay = CustomPIXIComponent(behavior, TYPE);

export default SelectionOverlay;
