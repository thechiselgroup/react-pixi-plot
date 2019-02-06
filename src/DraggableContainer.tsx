import { CustomPIXIComponent, Behavior, AppContext } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import { preventGlobalMouseEvents, restoreGlobalMouseEvents } from './globalEvents';
import React from 'react';

const TYPE = 'DraggableContainer';

interface Props {
  pixiInteractionManager: PIXI.interaction.InteractionManager;
  // positionDidUpdate: () => void;
}

class DraggableContainerBehavior implements Behavior<Props, PIXI.Container> {
  props: Props;
  dragAnchor: PIXI.Point;
  draggedInstance: PIXI.Container;

  customDisplayObject = (props: Props) => {
    const camera = new PIXI.Container();
    this.props = props;
    return camera;
  }

  customDidAttach = (instance: PIXI.Container) => {
    instance.interactive = true;
    instance.hitArea = instance.getBounds();

    instance.on('rightdown', (e: PIXI.interaction.InteractionEvent) => {
      this.draggedInstance = instance;
      this.dragAnchor = e.data.getLocalPosition(this.draggedInstance.parent);
      e.stopPropagation();
      this.captureMouseEvents();
    });

    instance.on('touchStart', (e: PIXI.interaction.InteractionEvent) => {
      const originalEvent = e.data.originalEvent as TouchEvent;
      this.draggedInstance = instance;
      if (originalEvent.targetTouches.length === 1) {
        this.dragAnchor = this.eventRendererPosition(originalEvent.targetTouches.item(0));
      }
    });
  }

  customWillDetach = (instance: PIXI.Container) => {
    instance.removeAllListeners();
  }

  /**
   * Correlates clicks on the renderer that happen
   * in screen space coordinates to renderer coordinates.
   *  Used to understand where the mouse event occurred inside the renderer.
   * @method
   * @param {MouseEvent} mouseEvent The mouse event.
   * @returns {PIXI.Point} The Point object containing the coordinates of the mouse,
   * in the renderer's coordinates system.
   */
  eventRendererPosition = (
    mouseEvent: MouseEvent | React.MouseEvent<HTMLDivElement> | React.Touch,
  ) => {
    const { mapPositionToPoint } = this.props.pixiInteractionManager;
    const mousePosition = new PIXI.Point();
    mapPositionToPoint
    .bind(this.props.pixiInteractionManager)(mousePosition, mouseEvent.clientX, mouseEvent.clientY);
    return mousePosition;
  }

  /**
   * @todo stop the preventDefault for contextmenu event listener
   * from preventing right clicking in the entire Lodestone application.
   * Isolates mouse events to the visualization by adding event listeners
   * and preventing mouse defaults and event propagation.
   * Handles cancelling the right mouse context menu.
   * @method
   * @param {object} e The mouse event.
   * @returns {undefined}
   */
  captureMouseEvents = () => {
    preventGlobalMouseEvents();
    document.addEventListener('mouseup', this.mouseUpListener, true);
    document.addEventListener('mousemove', this.mouseMoveListener, true);
    document.addEventListener('contextmenu', ev => ev.preventDefault(), true);
  }

  /**
   * Handles mouse button release.
   * Restores event listeners that were removed
   * during {@link PixiVisualization#captureMouseEvents|captureMouseEvents},
   * enables holding shift and selecting more points,
   * and removing points from selections with the right mouse button.
   * @method
   * @param {object} e The mouse up event.
   * @returns {undefined}
   */
  mouseUpListener = (e: MouseEvent) => {
    restoreGlobalMouseEvents();
    document.removeEventListener('mouseup', this.mouseUpListener, true);
    document.removeEventListener('mousemove', this.mouseMoveListener, true);
    document.removeEventListener('contextmenu', ev => ev.preventDefault(), true);
    e.preventDefault();
    delete this.dragAnchor;
  }

  handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.targetTouches.length === 0) { // no more touches
      delete this.dragAnchor;
    }
  }

  handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.targetTouches.length === 1) {
      const touch = e.targetTouches.item(0);
      const touchPosition = this.eventRendererPosition(touch);
      if (this.dragAnchor !== undefined) {
        this.drag(this.dragAnchor, touchPosition);
        this.dragAnchor = touchPosition;
      }
    }
  }

  /**
   * Handles mouse movement events.
   * If a selection has already been started this handles expanding the selection,
   * and handles panning to the new position if a pan is occuring.
   * @method
   * @param {object} e The mouse move event.
   * @returns {undefined}
   */
  mouseMoveListener = (e: MouseEvent) => {
    if (this.dragAnchor !== undefined) {
      e.stopPropagation();
      e.preventDefault();
      const mousePosition = this.eventRendererPosition(e);
      this.drag(this.dragAnchor, mousePosition);
      this.dragAnchor = mousePosition;
    }
  }

  /**
   * Pans the view inside of the renderer based on the mouse position.
   * @method
   * @param {object} mousePosition The position seen inside the event which triggered
   * {@link PixiVisualization#mouseMoveListener|mouseMoveListener}.
   * @returns {undefined}
   */
  drag = (from: PIXI.Point, to: PIXI.Point) => {
    const { position } = this.draggedInstance;
    const nextXPos = position.x + (to.x - from.x);
    const nextYPos = position.y + (to.y - from.y);
    this.draggedInstance.position.set(nextXPos, nextYPos);
  }

}

const DraggablePIXI = CustomPIXIComponent<Props, PIXI.Container>(
  new DraggableContainerBehavior(), TYPE,
);

const DraggableContainer: React.SFC = props => (
  <AppContext.Consumer>
    {app =>
      <DraggablePIXI pixiInteractionManager={app.renderer.plugins.interaction}>
        {props.children}
      </DraggablePIXI> }
  </AppContext.Consumer>
);

export default DraggableContainer;
