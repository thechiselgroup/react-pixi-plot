import { CustomPIXIComponent, Behavior, AppContext } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import React, { Dispatch } from 'react';
import normalizeWheel from 'normalize-wheel';
import { distance } from '../../utils';
import { PixiPlotActions, PixiPlotContext } from '../../PlotContext';

const TYPE = 'ZoomableContainer';

interface Props {
  app: PIXI.Application;
  dispatch: Dispatch<PixiPlotActions>;
  appWidth: number;
  appHeight: number;
}

interface ContainerDisplayObject extends PIXI.Container {
  _dispatch: Dispatch<PixiPlotActions>;
}

 /**
   * Sets the zoom of the view.
   * @method
   * @param delta The magitude of the zoom change.
   * @param mousePosition The location of the mouse when the zoom occured.
   */
const zoom = (
  instance: ContainerDisplayObject,
  factorX: number, factorY:number,
  mousePosition: PIXI.Point,
) => {
  const { scale, position } = instance;

  const localPositionBefore = instance.toLocal(mousePosition);
  const nextXScale = factorX * scale.x;
  const nextYScale = factorY * scale.y;
  scale.set(nextXScale, nextYScale);

  const localPositionAfter = instance.toLocal(mousePosition);

    // reposition the container so that the mouse points to the same position after zooming
  const nextXPos = position.x + (localPositionAfter.x - localPositionBefore.x) * scale.x;
  const nextYPos = position.y + (localPositionAfter.y - localPositionBefore.y) * scale.y;
  position.set(nextXPos, nextYPos);
  instance._dispatch({type: 'zoom', payload: {
    position: { x: nextXPos, y: nextYPos },
    scale: { x: nextXScale, y: nextYScale },
  }});
};

class ZoomableContainerBehavior implements Behavior<Props, PIXI.Container> {
  applyDisplayObjectProps: any; // created by react-pixi-fiber
  props: Props;
  initialPinchDistance: number;

  customDisplayObject = (props: Props) => {
    const instance = new PIXI.Container() as ContainerDisplayObject;
    instance._dispatch = props.dispatch;
    props.app.view.addEventListener('wheel', (e) => {
      this.props = props;
      const normalizedEvent = normalizeWheel(e);
      const mousePosition = new PIXI.Point();
      this.props.app.renderer.
        plugins.interaction.
        mapPositionToPoint(mousePosition, e.clientX, e.clientY);
      const zoomFactor = Math.pow(2, -normalizedEvent.pixelY / 500);
      zoom(instance, zoomFactor, zoomFactor, mousePosition);
      e.stopPropagation();
      e.preventDefault();
    });

    /*props.app.view.addEventListener('touchstart', (e) => {
      const position = new PIXI.Point(e.touches.item(0).clientX, e.touches.item(0).clientY);
      const found = props.app.renderer.plugins.interaction.hitTest(position, zoomable);
      if (found) zoomable.emit('starttouch', e);
    });*/

    return instance;
  }

  customApplyProps(displayObject: ContainerDisplayObject, oldProps: Props, newProps: Props) {
    this.applyDisplayObjectProps(oldProps, newProps);
    if (oldProps.dispatch !== newProps.dispatch) {
      displayObject._dispatch = newProps.dispatch;
    }

    if (oldProps.appWidth !== newProps.appWidth || oldProps.appWidth !== newProps.appHeight) {
      const updateZoom = () => {
        const bounds = displayObject.getBounds();
        if (bounds.height !== 0 && bounds.width !== 0) {
          zoom(
            displayObject,
            newProps.appWidth / displayObject.width,
            newProps.appHeight / displayObject.height,
            new PIXI.Point(),
          );
        } else {
          /**
           * Before the first render, the bounds are not calculated, so we wait a bit and try again
           */
          setTimeout(updateZoom, 10);
        }
      };
      updateZoom();
    }
  }

  customWillDetach = (instance: PIXI.Container) => {
    instance.removeAllListeners();
  }

  handleTouchStart = (e: TouchEvent) => {
    if (e.targetTouches.length === 2) {
      const a = this.getTouchPosition(e.targetTouches.item(0));
      const b = this.getTouchPosition(e.targetTouches.item(1));
      this.initialPinchDistance = distance(a, b);
    }
  }

  handleTouchEnd = (e: PIXI.interaction.InteractionEvent) => {
    if ((e.data.originalEvent as TouchEvent).targetTouches.length === 1) {
      delete this.initialPinchDistance;
    }
  }

  handleTouchMove = (e: PIXI.interaction.InteractionEvent) => {
    const targetTouches = (e.data.originalEvent as TouchEvent).targetTouches;
    if (targetTouches.length === 2) {
      const a = this.getTouchPosition(targetTouches.item(0));
      const b = this.getTouchPosition(targetTouches.item(1));
      const newPinchDistance = distance(a, b);
      const zoomFactor = newPinchDistance / this.initialPinchDistance;
      zoom(e.target as ContainerDisplayObject, zoomFactor, zoomFactor, a);
    }
  }

  getTouchPosition = (mouseEvent: Touch) => {
    const mousePosition = new PIXI.Point();
    this.props.app.renderer.plugins.interaction
      .mapPositionToPoint(mousePosition, mouseEvent.clientX, mouseEvent.clientY);
    return mousePosition;
  }
}

const ZoomablePIXI = CustomPIXIComponent<Props, PIXI.Container>(
  new ZoomableContainerBehavior(), TYPE,
);

const ZoomableContainer: React.SFC = props => (
  <PixiPlotContext.Consumer>
    { context =>
      <AppContext.Consumer>
        {app =>
          <ZoomablePIXI
            app={app}
            dispatch={context.dispatch}
            appHeight={context.state.appHeight}
            appWidth={context.state.appWidth}
          >
            {props.children}
          </ZoomablePIXI> }
      </AppContext.Consumer>
    }
  </PixiPlotContext.Consumer>
);

export default ZoomableContainer;
