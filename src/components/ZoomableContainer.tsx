import { CustomPIXIComponent, Behavior, AppContext } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import React from 'react';
import normalizeWheel from 'normalize-wheel';
import { distance } from '../utils';

const TYPE = 'ZoomableContainer';

interface Props {
  app: PIXI.Application;
}

export const zoomEventEmitter = new PIXI.utils.EventEmitter();

class DraggableContainerBehavior implements Behavior<Props, PIXI.Container> {
  props: Props;
  initialPinchDistance: number;

  customDisplayObject = (props: Props) => {
    const zoomable = new PIXI.Container();
    this.props = props;
    props.app.view.addEventListener('wheel', (e) => {
      const position = new PIXI.Point(e.clientX, e.clientY);
      const found = props.app.renderer.plugins.interaction.hitTest(position, zoomable);
      if (found) zoomable.emit('wheel', e);
    });

    props.app.view.addEventListener('touchstart', (e) => {
      const position = new PIXI.Point(e.touches.item(0).clientX, e.touches.item(0).clientY);
      const found = props.app.renderer.plugins.interaction.hitTest(position, zoomable);
      if (found) zoomable.emit('starttouch', e);
    });

    return zoomable;
  }

  customDidAttach = (instance: PIXI.Container) => {
    instance.interactive = true;
    instance.hitArea = { contains: () => true };

    instance.on('wheel', (e: WheelEvent) => {
      const normalizedEvent = normalizeWheel(e);
      const mousePosition = new PIXI.Point();
      this.props.app.renderer.
        plugins.interaction.
        mapPositionToPoint(mousePosition, e.clientX, e.clientY);
      this.zoom(instance, Math.pow(2, -normalizedEvent.pixelY / 500), mousePosition);
      e.stopPropagation();
      e.preventDefault();
    });

    instance.on('starttouch', this.handleTouchStart);
    instance.on('endtouch', this.handleTouchEnd);
    instance.on('movetouch', this.handleTouchMove);

    zoomEventEmitter.emit('zoom', instance);
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
      this.zoom(e.target as PIXI.Container, newPinchDistance / this.initialPinchDistance, a);
    }
  }

  getTouchPosition = (mouseEvent: Touch) => {
    const mousePosition = new PIXI.Point();
    this.props.app.renderer.plugins.interaction
      .mapPositionToPoint(mousePosition, mouseEvent.clientX, mouseEvent.clientY);
    return mousePosition;
  }

    /**
   * Sets the zoom of the view.
   * @method
   * @param delta The magitude of the zoom change.
   * @param mousePosition The location of the mouse when the zoom occured.
   */
  zoom = (instance: PIXI.Container, factor: number, mousePosition: PIXI.Point) => {
    const { scale, position } = instance;

    const localPositionBefore = instance.toLocal(mousePosition);
    const nextXScale = factor * scale.x;
    const nextYScale = factor * scale.y;
    scale.set(nextXScale, nextYScale);

    const localPositionAfter = instance.toLocal(mousePosition);

    // reposition the container so that the mouse points to the same position after zooming
    const nextXPos = position.x + (localPositionAfter.x - localPositionBefore.x) * scale.x;
    const nextYPos = position.y + (localPositionAfter.y - localPositionBefore.y) * scale.y;
    position.set(nextXPos, nextYPos);
    zoomEventEmitter.emit('zoom', instance);
  }
}

const ZoomablePIXI = CustomPIXIComponent<Props, PIXI.Container>(
  new DraggableContainerBehavior(), TYPE,
);

const ZoomableContainer: React.SFC = props => (
  <AppContext.Consumer>
    {app =>
      <ZoomablePIXI app={app}>
        {props.children}
      </ZoomablePIXI> }
  </AppContext.Consumer>
);

export default ZoomableContainer;
