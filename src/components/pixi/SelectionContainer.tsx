import { AppContext, Container } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import React from 'react';
import { preventGlobalMouseEvents, restoreGlobalMouseEvents } from '../../globalEvents';
import { HoverEvent, SelectEvent } from '../../types';
import { distance } from '../../utils';
import { PixiPlotContext } from '../../PlotContext';
import SelectionOverlay from './SelectionOverlay';

interface Props {
  onHover?: (e: HoverEvent) => void;
  onSelect?: (e: SelectEvent) => void;
  showBrushOverlay?: boolean;
  children?: any;
}

interface PropsFromContext {
  appWidth: number;
  appHeight: number;
  draggablePosition: {x: number, y:number};
  zoomablePosition: {x: number, y: number};
  zoomableScale: {x: number, y: number};
  interactionManager: PIXI.interaction.InteractionManager;
  canvas: HTMLCanvasElement;
}

interface State {
  brushRectangle?: PIXI.Rectangle;
  viewRectangle?: PIXI.Rectangle;
  removingFromSelection?: boolean;
}

const MIN_DRAG_DISTANCE = 3;
const LEFT_BUTTON = 0;

class SelectionContainer extends React.PureComponent<Props & PropsFromContext, State> {
  selectStart: PIXI.Point;
  addToSelection: boolean;
  removeFromSelection: boolean;

  static defaultProps = {
    onHover: () => {},
    onSelect: () => {},
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  /**
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
  }

  componentDidMount() {
    this.props.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.props.canvas.addEventListener('mousemove', this.handleMouseMove);
  }

  /**
   * Handles all mouse down events.
   * When using the left mouse button checks if shift or
   * control keys (e.shiftKey, e.ctrlKey booleans)
   * are pressed to know if a selection add or remove is occuring.
   * When using the right mouse button performs a pan of the visualization.
   * @method
   * @param {object} e The mouse down event.
   * @returns {undefined}
   */
  handleMouseDown = (e: MouseEvent) => {
    this.captureMouseEvents();
    if (e.button === LEFT_BUTTON) {
      this.selectStart = this.eventRendererPosition(e);
      this.addToSelection = e.shiftKey;
      this.removeFromSelection = e.ctrlKey;
    }
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
    if (e.button === LEFT_BUTTON && this.selectStart) {

      let mousePosition = this.eventRendererPosition(e);

      if (distance(this.selectStart, mousePosition) >= MIN_DRAG_DISTANCE) {
        // change mousePosition to be within the canvas size

        mousePosition = this.constrainMousePosition(mousePosition);
        const pixelBounds = new PIXI.Rectangle(
          Math.min(this.selectStart.x, mousePosition.x),
          Math.min(this.selectStart.y, mousePosition.y),
          Math.abs(this.selectStart.x - mousePosition.x),
          Math.abs(this.selectStart.y - mousePosition.y),
        );

        const plotBounds = this.pixelToPlotBounds(pixelBounds);

        this.setState({
          brushRectangle: null,
        });

        this.props.onSelect({
          pixelBounds,
          plotBounds,
          addToSelection: e.ctrlKey,
          removeFromSelection: e.shiftKey,
          isBrushing: true,
          nativeEvent: e,
        });
        delete this.addToSelection;
        delete this.removeFromSelection;
      } else {
        const localPosition = this.eventLocalPosition(e);
        this.props.onSelect({
          pixelBounds: new PIXI.Rectangle(mousePosition.x, mousePosition.y),
          plotBounds: new PIXI.Rectangle(localPosition.x, localPosition.y),
          addToSelection: e.ctrlKey,
          removeFromSelection: e.shiftKey,
          isBrushing: false,
          nativeEvent: e,
        });
      }
      delete this.selectStart;
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
    e.stopPropagation();
    e.preventDefault();
    let mousePosition = this.eventRendererPosition(e);

    if (this.selectStart !== undefined) {
      // change mousePosition to be within the canvas size.
      mousePosition = this.constrainMousePosition(mousePosition);
      const pixelBounds = new PIXI.Rectangle(
        Math.min(this.selectStart.x, mousePosition.x),
        Math.min(this.selectStart.y, mousePosition.y),
        Math.abs(this.selectStart.x - mousePosition.x),
        Math.abs(this.selectStart.y - mousePosition.y),
      );

      const plotBounds = this.pixelToPlotBounds(pixelBounds);
      const { appWidth, appHeight } = this.props;
      this.setState({
        brushRectangle: plotBounds,
        viewRectangle: this.pixelToPlotBounds(new PIXI.Rectangle(0, 0, appWidth, appHeight)),
        removingFromSelection: e.ctrlKey,
      });

      this.props.onHover({
        pixelBounds,
        plotBounds,
        isBrushing: true,
        nativeEvent: e,
      });
    }
  }

  /**
   * Handles keeping the mouse within the canvas if a mouse-based interaction is occuring.
   * @method
   * @param {object} mousePosition Where the mouse is currently.
   * @returns {object} Where we have constrained the mouse to be.
   */
  constrainMousePosition = (mousePosition: PIXI.Point) => {
    const { appHeight, appWidth } = this.props;
    const x = mousePosition.x;
    const y = mousePosition.y;
    if (x < 0) mousePosition.x = 0;
    else if (x > appWidth) mousePosition.x = appWidth;
    if (y < 0) mousePosition.y = 0;
    else if (y > appHeight) mousePosition.y = appHeight;
    return mousePosition;
  }

  /**
   * Handles moving the mouse.
   * Determines the mouse's position and if the ctrl key
   * isn't pressed we hover the data under the mouse cursor.
   * @method
   * @param {object} e The mouse move event.
   * @returns {undefined}
   */
  handleMouseMove = (e: MouseEvent) => {
    const mousePosition = this.eventRendererPosition(e);
    const localPosition = this.eventLocalPosition(e);
    if (!e.ctrlKey) {
      this.props.onHover({
        pixelBounds: new PIXI.Rectangle(mousePosition.x, mousePosition.y),
        plotBounds: new PIXI.Rectangle(localPosition.x, localPosition.y),
        isBrushing: false,
        nativeEvent: e,
      });
    }
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
  eventLocalPosition(mouseEvent: MouseEvent | React.MouseEvent<HTMLDivElement> | React.Touch) {
    const { draggablePosition, zoomablePosition, zoomableScale } = this.props;
    const rendererPosition = this.eventRendererPosition(mouseEvent);
    return new PIXI.Point(
      (rendererPosition.x - draggablePosition.x - zoomablePosition.x) / zoomableScale.x,
      (rendererPosition.y - draggablePosition.y - zoomablePosition.y) / zoomableScale.y,
    );
  }

  pixelToPlotBounds = (pixelBounds: PIXI.Rectangle) => {
    const { draggablePosition, zoomablePosition, zoomableScale } = this.props;
    const topLeft = new PIXI.Point(
      (pixelBounds.left - draggablePosition.x - zoomablePosition.x) / zoomableScale.x,
      (pixelBounds.top - draggablePosition.y - zoomablePosition.y) / zoomableScale.y,
    );

    const width = pixelBounds.width / zoomableScale.x;
    const height = pixelBounds.height / zoomableScale.y;
    return new PIXI.Rectangle(topLeft.x, topLeft.y, width, height);
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
  eventRendererPosition(mouseEvent: MouseEvent | React.MouseEvent<HTMLDivElement> | React.Touch) {
    const { interactionManager } = this.props;
    const mousePosition = new PIXI.Point();
    interactionManager.mapPositionToPoint(mousePosition, mouseEvent.clientX, mouseEvent.clientY);
    return mousePosition;
  }

  render() {
    const { children, showBrushOverlay } = this.props;
    const { brushRectangle, viewRectangle, removingFromSelection } = this.state;
    return (
      <Container>
        {children}
        {showBrushOverlay && brushRectangle &&
          <SelectionOverlay
            selectionRectangle={brushRectangle}
            viewRectangle={viewRectangle}
            invert={removingFromSelection}
          />
        }
      </Container>
    );
  }

}

export default (props: Props) =>
  <PixiPlotContext.Consumer>
    {({ state }) =>
    <AppContext.Consumer>
      {app =>
        <SelectionContainer
          appHeight={state.appHeight}
          appWidth={state.appWidth}
          draggablePosition={state.draggablePosition}
          zoomablePosition={state.zoomablePosition}
          zoomableScale={state.zoomableScale}
          canvas={app.view}
          interactionManager={app.renderer.plugins.interaction}
          {...props}
        />
      }
    </AppContext.Consumer>
    }
  </PixiPlotContext.Consumer>;
