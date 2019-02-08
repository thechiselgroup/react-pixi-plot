import { CustomPIXIComponent, Behavior, AppContext } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import React from 'react';
import normalizeWheel from 'normalize-wheel';

const TYPE = 'ZoomableContainer';

interface Props {
  app: PIXI.Application;
}

export const zoomEventEmitter = new PIXI.utils.EventEmitter();

class DraggableContainerBehavior implements Behavior<Props, PIXI.Container> {
  props: Props;
  dragAnchor: PIXI.Point;
  draggedInstance: PIXI.Container;

  customDisplayObject = (props: Props) => {
    const zoomable = new PIXI.Container();
    this.props = props;
    props.app.view.addEventListener('wheel', (e) => {
      const position = new PIXI.Point(e.clientX, e.clientY);
      const found = props.app.renderer.plugins.interaction.hitTest(position, zoomable);
      if (found) zoomable.emit('wheel', e);
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

    zoomEventEmitter.emit('zoom', instance);
  }

  customWillDetach = (instance: PIXI.Container) => {
    instance.removeAllListeners();
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
