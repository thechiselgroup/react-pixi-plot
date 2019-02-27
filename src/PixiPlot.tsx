import React from 'react';
import { Stage } from 'react-pixi-fiber';
import ContainerDimensions from 'react-container-dimensions';
import Axes, { AnyScale } from './components/dom/Axes';
import { PlotContextProvider, DomPlotContext, PixiPlotContext } from './PlotContext';

const preventDefault = (e: React.MouseEvent<HTMLElement>) => {
  e.nativeEvent.preventDefault();
  return true;
};

export interface PixiPlotProps {
  /**
   * A d3 scale that will be displayed along the left axis.
   * You need to specify a renderer margin to allow room for this axis
   */
  readonly leftAxisScale?: AnyScale;

  /**
   * The label for the left axis
   */
  readonly leftLabel?: string;

  /**
   * A d3 scale that will be displayed along the right axis.
   * You need to specify a renderer margin to allow room for this axis
   */
  readonly rightAxisScale?: AnyScale;

  /**
   * The label for the right axis
   */
  readonly rightLabel?: string;

  /**
   * A d3 scale that will be displayed along the top axis.
   * You need to specify a renderer margin to allow room for this axis
   */
  readonly topAxisScale?: AnyScale;

  /**
   * The label for the top axis
   */
  readonly topLabel?: string;

  /**
   * A d3 scale that will be displayed along the bottom axis.
   * You need to specify a renderer margin to allow room for this axis
   */
  readonly bottomAxisScale?: AnyScale;

  /**
   * The label for the bottom axis
   */
  readonly bottomLabel?: string;

  /**
   * The margins around the renderer, where you can display axes for instance
   */
  readonly rendererMargins?: {left: number, right: number, top: number, bottom: number};
}

const STAGE_OPTIONS = {
  antialias: true,
  backgroundColor: 0xFFFFFF,
};

const PixiPlot: React.SFC<PixiPlotProps>  = (props) => {
  const { left, right, top, bottom } = props.rendererMargins;
  const {
      leftAxisScale, leftLabel, rightAxisScale,
      rightLabel, bottomAxisScale, bottomLabel, topAxisScale, topLabel,
    } = props;

  return (
      <div style={{ width: '100%', height: '100%' }} onContextMenu={preventDefault}>
        <ContainerDimensions>
          { ({ width, height }) =>
            <PlotContextProvider appHeight={height - top - bottom} appWidth={width - left - right}>
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
                  rightAxisScale={rightAxisScale}
                  rightLabel={rightLabel}
                  topAxisScale={topAxisScale}
                  topLabel={topLabel}
                  bottomAxisScale={bottomAxisScale}
                  bottomLabel={bottomLabel}
                />
                <div
                  style={{
                    marginLeft: left, marginRight: right, marginTop: top, marginBottom: bottom,
                    position: 'absolute',
                  }}
                >
                <DomPlotContext.Consumer>
                  { value =>
                    <Stage
                      width={width - left - right}
                      height={height - top - bottom}
                      options={STAGE_OPTIONS}
                    >
                      <PixiPlotContext.Provider value={value} >
                        {props.children}
                      </PixiPlotContext.Provider>
                    </Stage>}
                </DomPlotContext.Consumer>
                </div>
              </React.Fragment>
            </PlotContextProvider>
          }
        </ContainerDimensions>
      </div>
  );
};

PixiPlot.defaultProps = {
  rendererMargins: {
    top: 0, bottom: 0, left: 0, right: 0,
  },
};

export default PixiPlot;
