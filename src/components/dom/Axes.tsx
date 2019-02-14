import React from 'react';
import { ScaleBand, ScaleContinuousNumeric, ScaleOrdinal, ScalePoint } from 'd3-scale';
import Axis, { AxisOrientation } from './Axis';
import { DomPlotContext } from '../../PlotContext';

export type AnyScale =
  ScaleContinuousNumeric<number, number>
  | ScaleBand<any>
  | ScaleOrdinal<any, number>
  | ScalePoint<any>;

interface Props {
  leftAxisScale?: AnyScale;
  leftLabel?: string;
  rightAxisScale?: AnyScale;
  topAxisScale?: AnyScale;
  bottomAxisScale?: AnyScale;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  containerWidth: number;
  containerHeight: number;
}

const getTransformedScale = (
  scale: AnyScale,
  translate: number,
  scaleFactor: number,
) => {
  const newRange = scale.range();
  newRange[0] *= scaleFactor;
  newRange[0] += translate;
  newRange[1] += translate;
  return scale.copy().range(newRange) as AnyScale;
};

const PlotAxes: React.SFC<Props> = (props) => {
  const { state } = React.useContext(DomPlotContext);

  const leftAxisScale = getTransformedScale(
    props.leftAxisScale,
    state.draggablePosition.y + state.zoomablePosition.y,
    state.zoomableScale.y,
  );

  const {
      leftLabel,
      marginLeft, marginTop, containerHeight, containerWidth,
    } = props;
  let leftAxis: JSX.Element;

  if (leftAxisScale) {
    leftAxis = (
        <g transform={`translate(${marginLeft},${marginTop})`}>
          <Axis orient={AxisOrientation.LEFT} scale={leftAxisScale}/>
          {leftLabel &&
            <text
              fontSize="10"
              textAnchor="middle"
              transform="rotate(-90)"
              x={containerHeight / 2}
              y={0}
            >{leftLabel}</text>
          }
        </g>);
  }

  return (
      <svg
        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
        width={containerWidth}
        height={containerHeight}
      >
        {leftAxis}
      </svg>
  );
};

export default PlotAxes;
