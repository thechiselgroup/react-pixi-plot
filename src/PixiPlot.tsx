import React from 'react';
import DraggableContainer from './DraggableContainer';
import { SelectEvent, HoverEvent } from './types';
import * as PIXI from 'pixi.js';
import { Stage, Container, AppContext } from 'react-pixi-fiber';

const preventDefault = (e: React.MouseEvent<HTMLElement>) => {
  e.nativeEvent.preventDefault();
  return true;
};

export interface PixiPlotProps {

  readonly displayObjectsInFront?: PIXI.DisplayObject[];

  /**
   * A Rectangle defining the bounds of the display objects.
   * This is use for the initial rendering of the plot,
   * when computing the scale and position of the plot container.
   * If ommited, the getBounds method from the plot container will be used instead.
   * If the displayObjects contain textured sprites that need to be rescaled,
   * you shoud specify the bounds.
   * If it contains Graphics objects, this prop can be ommited.
   */
  readonly displayObjectsBounds?: PIXI.Rectangle;

  /**
   * The margins around the renderer, where you can display axes for instance
   */
  readonly rendererMargins?: {left: number, right: number, top: number, bottom: number};

  /**
   * The margins around the stage, in pixels.
   */
  readonly stageMargins?: {left: number, right: number, top: number, bottom: number};

  /**
   * The size of the plot, in pixels
   */
  readonly size: {height: number, width: number};

  /**
   * If true, the x and y scales will be identical
   */
  readonly keepAspectRatio?: boolean;

  readonly invertYScale?: boolean;

  /**
   * This callback is invoked whenever the user clicks or brushes on the visualization.
    */
  readonly onSelect?: (e: SelectEvent, target: PixiPlot) => void;

  /**
   * This callback is invoked whenever the user hovers on the visualization, or while brushing.
   */
  readonly onHover?: (e: HoverEvent, target: PixiPlot) => void;

  /**
   * Invoked after the next value for the scale is computed,
   * but before re-rendering. This is a good place to update the plot if needed.
   * @abstract
   * @method
   * @param {number} nextXScale The next X scale.
   * @param {number} nextYScale The next Y scale.
   */
  readonly scaleWillUpdate?: (nextXScale: number, nextYScale: number, target: PixiPlot) => void;

  /**
   * Invoked after the next value for the position is computed,
   * but before re-rendering. This is a good place to update the plot if needed.
   * @abstract
   * @method
   * @param {PIXI.Point} nextPos The next position.
   */
  readonly positionWillUpdate?: (nextPos: PIXI.Point, target: PixiPlot) => void;

  /**
   * Invoked after the scale was updated, and after the stage re-rendered.
   * @abstract
   * @method
   */
  readonly scaleDidUpdate?: (target: PixiPlot) => void;

  /**
   * Invoked after the position was updated, and after the stage re-rendered.
   * @abstract
   * @method
   */
  readonly positionDidUpdate?: (target: PixiPlot) => void;

  /**
   * Invoked before any change is made to the x component of the stage position.
   * If it returns false, the x component of the position will not change.
   * Intended to be redefined to use parameter.
   * @abstract
   * @method
   * @param {number} nextXPos The next x position, relative to the left edge of the renderer.
   * @returns {boolean} Always returns true unless redefined in a subclass.
   */
  readonly shouldXPositionUpdate?: (nextXPos: number, target: PixiPlot) => boolean;

  /**
   * Invoked before any change is made to the y component of the stage position.
   * If it returns false, the y component of the position will not change.
   * Intended to be redefined to use parameter.
   * @abstract
   * @method
   * @param {number} nextYPos The next y position, relative to the top edge of the renderer.
   * @returns {boolean} Always returns true unless redefined in a subclass.
   */
  readonly shouldYPositionUpdate?: (nextYPos: number, target: PixiPlot) => boolean;

  /**
   * Invoked before any change is made to the x component of the stage scale.
   *  If it returns false, the x component of the scale will not change.
   *  Intended to be redefined to use parameter.
   * @abstract
   * @method
   * @param {number} nextXScale The next x scale.
   * @param {number} isZooming The plot scale is updating because the user is zooming.
   * @param {number} isResizing The plot scale is updating because the user is resizing the plot.
   * @returns {boolean} Always returns true unless redefined in a subclass.
   */
  readonly shouldXScaleUpdate?: (
    nextXScale: number,
    isZooming: boolean,
    isResizing: boolean,
    target: PixiPlot,
  ) => boolean;

  /**
   * Invoked before any change is made to the y component of the stage scale.
   * If it returns false, the y component of the scale will not change.
   * Intended to be redefined to use parameter.
   * @abstract
   * @method
   * @param {number} nextYScale The next y scale.
   * @param {number} isZooming The plot scale is updating because the user is zooming.
   * @param {number} isResizing The plot scale is updating because the user is resizing the plot.
   * @returns {boolean} Always returns true unless redefined in a subclass.
   */
  readonly shouldYScaleUpdate?: (
    nextYScale: number,
    isZooming: boolean,
    isResizing: boolean,
    target: PixiPlot,
  ) => boolean;

  readonly dirty?: number;

  readonly manageInteractions?: boolean;

  readonly children: any[];
}

export interface PixiPlotState {
  readonly yScaleInverter: number;
}

const STAGE_OPTIONS = {
  antialias: true,
  backgroundColor: 0xFFFFFF,
};

export default class PixiPlot extends React.Component<PixiPlotProps, PixiPlotState> {
  static defaultProps = {
    rendererMargins: {
      top: 0, bottom: 0, left: 0, right: 0,
    },
    stageMargins: {
      top: 0, bottom: 0, left: 0, right: 0,
    },
    keepAspectRatio: false,
    dirty: 0,
    manageInteractions: true,
    invertYScale: false,
    scaleWillUpdate: () => {},
    scaleDidUpdate: () => {},
    positionWillUpdate: () => {},
    positionDidUpdate: () => {},
    onSelect: () => {},
    onHover: () => {},
    shouldXPositionUpdate: () => true,
    shouldYPositionUpdate: () => true,
    shouldXScaleUpdate: () => true,
    shouldYScaleUpdate: () => true,
  };

  plotContainer: PIXI.Container;
  selectionOverlayContainer: PIXI.Container;
  zoomFactorX: number;
  zoomFactorY: number;

  constructor(props: PixiPlotProps) {
    super(props);

    /**
     * The selection overlay
     * {@link http://pixijs.download/dev/docs/PIXI.Container.html| Pixi.Container}.
     * @member
     */
    this.selectionOverlayContainer = new PIXI.Container();

    /**
     * The zoom factor used in calculations of view rendering. Intialized to 1.
     * @member
     */
    this.zoomFactorX = 1;
    this.zoomFactorY = 1;

    this.state = {
      yScaleInverter: props.invertYScale ? -1 : 1,
    };
  }

  /**
   * {@link https://reactjs.org/docs/react-component.html#componentdidupdate|React.Component}
   * function called after the component updates.
   * @method
   * @override
   * @param {object} prevProps The previous props.
   * @param {object} prevState The previous state.
   * @returns {undefined}
   */
  componentDidUpdate(prevProps: PixiPlotProps) {
    const { size } = this.props;

    if (prevProps.size !== size) {
      this.resize();
    }

    if (prevProps.displayObjectsBounds !== this.props.displayObjectsBounds) {
      this.zoomToFit();
    }
  }

  getDisplayObjectsBounds  = () => {
    return this.props.displayObjectsBounds || this.plotContainer.getLocalBounds();
  }

  /**
   * Sets the zoom of the view.
   * @method
   * @param {number} delta The magitude of the zoom change.
   * @param {object} mousePosition The location of the mouse when the zoom occured.
   * This determines what portion of the visualization we zoom into.
   * @returns {undefined}
   */
  zoom = (factor: number, mousePosition: PIXI.Point) => {
    const { scale } = this.plotContainer;

    const nextXScale = this.zoomFactorX * factor * scale.x;
    if (this.props.shouldXScaleUpdate(nextXScale, true, false, this)) {
      this.zoomFactorX *= factor;
    }

    const nextYScale = this.state.yScaleInverter * this.zoomFactorY * factor * scale.y;
    if (this.props.shouldYScaleUpdate(nextYScale, true, false, this)) {
      this.zoomFactorY *= factor;
    }
    this.rescale(mousePosition, true);
  }

  /**
   * If the view scale and position needs to be updated,
   * rescales and repositions the view given an anchoring point.
   * @method
   * @param {PIXI.Point} anchorPoint The x and y coordinates of the proposed rescale and reposition.
   * @returns {void}
   */
  rescale = (anchorPoint = new PIXI.Point(0, 0), isZooming = false, isResizing = false) => {
    const { scale } = this.plotContainer;
    const scaledAnchorPoint = this.rendererToStagePosition(anchorPoint);
    if (this.updateScale(isZooming, isResizing)) {
      let updatedPosition = false;
      const nextXPos = anchorPoint.x - scale.x * scaledAnchorPoint.x;
      const nextYPos = anchorPoint.y - scale.y * scaledAnchorPoint.y;

      updatedPosition = this.updatePosition(nextXPos, nextYPos);

      this.props.scaleDidUpdate(this);

      if (updatedPosition) this.props.positionDidUpdate(this);
    }
  }

  /**
   * Resizes and rescales the renderer when the visualization changes size.
   * @method
   * @returns {void}
   */
  resize = () => {
    this.rescale(new PIXI.Point(0, 0), false, true);
  }

  /**
   * Rescales and zooms the stage when the stageBoundaries change.
   * @method
   * @returns {void}
   */
  zoomToFit = () => {
    this.zoomFactorX = 1;
    this.zoomFactorY = 1;
    this.resize();
    const { stageMargins: { top, left } } = this.props;

    const { scale } = this.plotContainer;
    if (this.updatePosition(
      left - this.getDisplayObjectsBounds().left * scale.x,
      top - this.getDisplayObjectsBounds().top * scale.y,
    )) {
      this.props.positionDidUpdate(this);
    }
  }

  /**
   * Updates the container scale based on the current zoomFactor
   * @method
   * @returns {boolean} True if the scale changed, otherwise false.
   */
  updateScale = (isZooming: boolean, isResizing: boolean) => {
    const { scale } = this.plotContainer;
    const { top, bottom, left, right } = this.props.stageMargins;

    let updatedScale = false;

    let nextXScale = this.zoomFactorX *
      (this.getRendererWidth() - left - right) / this.getDisplayObjectsBounds().width;
    if (this.props.shouldXScaleUpdate(nextXScale, isZooming, isResizing, this)) {
      updatedScale = true;
    } else {
      nextXScale = scale.x;
    }

    let nextYScale =
      this.state.yScaleInverter *
      this.zoomFactorY *
      (this.getRendererHeight() - top - bottom) / this.getDisplayObjectsBounds().height;

    if (this.props.shouldYScaleUpdate(nextYScale, isZooming, isResizing, this)) {
      updatedScale = true;
    } else {
      nextYScale = scale.y;
    }

    if (updatedScale) {
      if (this.props.keepAspectRatio) {
        const newScale = Math.min(nextXScale, this.state.yScaleInverter * nextYScale);
        nextXScale = newScale;
        nextYScale = this.state.yScaleInverter * newScale;
      }
      this.props.scaleWillUpdate(nextXScale, nextYScale, this);

      scale.set(nextXScale, nextYScale);
    }

    return updatedScale;
  }

  /**
   * Tries to update position by checking if the x and y positions should update through
   * {@link PixiVisualization#shouldXPositionUpdate|shouldXPositionUpdate} and
   * {@link PixiVisualization#shouldYPositionUpdate|shouldYPositionUpdate}.
   * @method
   * @param x The proposed new x position.
   * @param y The proposed new y position.
   * @returns {boolean} False unless we update position.
   */
  updatePosition = (x: number, y: number) => {
    let nextX = x;
    let nextY = y;
    const { position } = this.plotContainer;
    let updatePos = false;

    if (this.props.shouldXPositionUpdate(nextX, this)) {
      updatePos = true;
    } else {
      nextX = position.x;
    }

    if (this.props.shouldYPositionUpdate(nextY, this)) {
      updatePos = true;
    } else {
      nextY = position.y;
    }

    if (updatePos) {
      position.set(nextX, nextY);
    }

    return updatePos;
  }

  /**
   * Enables clicking and dragging a selection overlay on top of the data.
   * Initially fades all points not in the selection,
   * then as points enter the selection unfade them.
   * Rerendered whenever the mouse moves during a click and drag on the view.
   * @method
   * @param {object} selectStart The point where the mouse click and drag begins.
   * @param {object} selectEnd The point where the mouse click and drag ends.
   * @param {boolean} removeFromSelection A boolean controlled by modifier keys.
   * Default is false, but set this true if a modifier key combination is being used.
   * @returns {undefined}
   */
  showSelectionOverlay = (rect: PIXI.Rectangle, removeFromSelection = false) => {
    const background = 0xFFFFFF;
    const backgroundAlpha = 0.4;
    const lineWidth = 2;
    const lineColor = 0xCCCCCC;
    const { size: { width, height } = { width: 0, height: 0 } } = this.props;
    this.selectionOverlayContainer.removeChildren();

    const selectionOverlay = new PIXI.Graphics();

    // Fade everything that is not selected.
    selectionOverlay.beginFill(background, backgroundAlpha);
    if (!removeFromSelection) {
      selectionOverlay.drawRect(0, 0, width, rect.top); // top rectangle
      selectionOverlay.drawRect(0, rect.bottom, width, height - rect.bottom); // bottom rectangle
      selectionOverlay.drawRect(0, rect.top, rect.left, rect.height); // left rectangle
      selectionOverlay.drawRect(
        rect.right,
        rect.top,
        width - rect.right,
        rect.height,
      ); // right rectangle
    } else {
      selectionOverlay.drawRect(rect.left, rect.top, rect.width , rect.height);
    }
    selectionOverlay.endFill();

    selectionOverlay.lineStyle(lineWidth, lineColor);
    selectionOverlay.drawRect(rect.left, rect.top, rect.width, rect.height);

    this.selectionOverlayContainer.addChild(selectionOverlay);
  }

  /**
   * Removes the children from the selectionOverlayContainer.
   * Called when a click and drag ends,
   * and when the user clicks anywhere and isn't doing a click and drag on the renderer.
   */
  hideSelectionOverlay = () => {
    this.selectionOverlayContainer.removeChildren();
  }

  /**
   * Correlates points in the renderer space to stage space.
   * @method
   * @param {PIXI.Point} rendererPosition A Point object in the renderer's coordinates system
   * @returns {PIXI.Point} The Point object containing the coordinates,
   * scaled with the plotContainer scale and position
   */
  rendererToStagePosition = (rendererPosition: {x: number, y: number}) => {
    return new PIXI.Point(
      (rendererPosition.x - this.plotContainer.position.x) / this.plotContainer.scale.x,
      (rendererPosition.y - this.plotContainer.position.y) / this.plotContainer.scale.y,
    );
  }

  /**
   * Correlates points in the stage space to renderer space.
   * @method
   * @param {PIXI.Point} stagePosition A Point object in the stage's coordinates system
   * @returns {PIXI.Point} The Point object containing the coordinates,
   * scaled with the plotContainer scale and position
   */
  stageToRendererPosition = (stagePosition: PIXI.Point) => {
    return new PIXI.Point(
      stagePosition.x * this.plotContainer.scale.x + this.plotContainer.position.x,
      stagePosition.y * this.plotContainer.scale.y + this.plotContainer.position.y,
    );
  }

  /**
   * Returns the renderer's content width, in pixels (margins not included).
   * @method
   * @returns {number}
   * rendererWidth = (stageWidth - rendererMarginLeft - rendererMarginRight).
   * Will always be greater or equal to 0.
   */
  getRendererWidth = () => {
    const { size = { width: 0 } } = this.props;
    const { left, right } = this.props.rendererMargins;
    return size.width - left - right;
  }

  /**
   * Returns the renderer height calculated as stage
   * height less the top and bottom renderer margins.
   * This is because the renderer sits within renderer margins inside the stage.
   * @method
   * @returns {number}
   * rendererHeight = (stageHeight - rendererMarginTop - rendererMarginBottom).
   * Will always be greater or equal to 0.
   */
  getRendererHeight = () => {
    const { size = { height: 0 } } = this.props;
    const { top, bottom } = this.props.rendererMargins;
    return size.height - top - bottom;
  }

  pixelToPlotBounds = (pixelBounds: PIXI.Rectangle) => {
    const topLeft = this.rendererToStagePosition(new PIXI.Point(pixelBounds.left, pixelBounds.top));
    const width = pixelBounds.width / this.plotContainer.scale.x;
    const height = pixelBounds.height / this.plotContainer.scale.y;
    return new PIXI.Rectangle(topLeft.x, topLeft.y, width, height);
  }

  handleSelect = (e: SelectEvent) => {
    this.hideSelectionOverlay();
    this.props.onSelect({
      ...e,
      plotBounds: this.pixelToPlotBounds(e.pixelBounds),
    },                  this);
  }

  handleHover = (e: HoverEvent) => {
    if (e.pixelBounds.width !== 0 && e.pixelBounds.height !== 0) { // we are currently brushing
      this.showSelectionOverlay(e.pixelBounds, e.nativeEvent.ctrlKey);
      if (e.nativeEvent.ctrlKey) { // if we are unselecting the data, don't hover it
        return;
      }
    }

    this.props.onHover({
      ...e,
      plotBounds: this.pixelToPlotBounds(e.pixelBounds),
    },                 this);

  }

  /**
   * The {@link https://reactjs.org/docs/react-dom.html#render|React.Component render}
   * method that must be defined for presentational components.
   * @method
   * @returns {JSX} PixiVisualization component that is initialized with functionality.
   */
  render() {
    // const { left, right, top, bottom } = this.props.rendererMargins;
    /*const style = {
      marginLeft: left ,
      marginRight: right,
      marginTop: top ,
      marginBottom: bottom,
    };*/

    return (
      <div onContextMenu={preventDefault}>
      <Stage
        width={this.getRendererWidth()}
        height={this.getRendererHeight()}
        options={STAGE_OPTIONS}
      >
        <AppContext.Consumer>
          {app =>
            <DraggableContainer
              pixiInteractionManager={app.renderer.plugins.interaction}
            >
              <Container>
                {this.props.children}
              </Container>
            </DraggableContainer>
          }
        </AppContext.Consumer>
      </Stage>
      </div>
    );
  }
}
