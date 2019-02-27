import { CustomPIXIComponent, Behavior } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import SVGGraphics from './SVGGraphics';

interface Props {
  svgElement: HTMLElement;
  lineWidthScale?: number;
  tint?: number;
}

const behavior: Behavior<Props, PIXI.Container> = {
  customDisplayObject: () => new PIXI.Container(),
  customApplyProps(container, oldProps, newProps) {
    const { svgElement, lineWidthScale, tint } = newProps;
    if (oldProps.svgElement !== newProps.svgElement ||
      oldProps.lineWidthScale !== newProps.lineWidthScale) {
      container.removeChildren();
      container.addChild(new SVGGraphics(svgElement, lineWidthScale));
    }

    if (oldProps.tint !== newProps.tint) {
      (container.children[0] as SVGGraphics).tint = tint;
    }
  },
};

export default CustomPIXIComponent(behavior, 'SVGContainer');
