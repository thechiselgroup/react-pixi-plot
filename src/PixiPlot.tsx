import React from 'react';
import { SelectEvent, HoverEvent } from './types';
import * as PIXI from 'pixi.js';
import { Stage } from 'react-pixi-fiber';
import ContainerDimensions from 'react-container-dimensions';
import Axes, { AnyScale } from './components/dom/Axes';

const preventDefault = (e: React.MouseEvent<HTMLElement>) => {
  e.nativeEvent.preventDefault();
  return true;
};

export interface PixiPlotProps {

  leftAxisScale?: AnyScale;
  leftLabel?: string;

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

  getDisplayObjectsBounds  = () => {
    return this.props.displayObjectsBounds || this.plotContainer.getLocalBounds();
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
  /*showSelectionOverlay = (rect: PIXI.Rectangle, removeFromSelection = false) => {
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
  }*/

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

 /* handleHover = (e: HoverEvent) => {
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

  }*/

  /**
   * The {@link https://reactjs.org/docs/react-dom.html#render|React.Component render}
   * method that must be defined for presentational components.
   * @method
   * @returns {JSX} PixiVisualization component that is initialized with functionality.
   */
  render() {
    const { left, right, top, bottom } = this.props.rendererMargins;
    const { leftAxisScale, leftLabel } = this.props;
    /*const style = {
      marginLeft: left ,
      marginRight: right,
      marginTop: top ,
      marginBottom: bottom,
    };*/

    return (
      <div style={{ width: '100%', height: '100%' }} onContextMenu={preventDefault}>
        <ContainerDimensions>
          { ({ width, height }) =>
            <React.Fragment>
              <Axes
                marginLeft={left}
                marginRight={right}
                marginBottom={bottom}
                marginTop={top}
                containerWidth={width}
                containerHeight={height}
                leftAxisScale={leftAxisScale}
                leftLabel={leftLabel}
              />
              <div
                style={{
                  marginLeft: left, marginRight: right, marginTop: top, marginBottom: bottom,
                }}
              >
                <Stage
                  width={width - left - right}
                  height={height - top - bottom}
                  options={STAGE_OPTIONS}
                >
                  {this.props.children}
                </Stage>
              </div>
            </React.Fragment>
        }
        </ContainerDimensions>
      </div>
    );
  }
}
