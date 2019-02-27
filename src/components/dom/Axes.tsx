import React from 'react';
import { ScaleBand, ScaleContinuousNumeric, ScalePoint } from 'd3-scale';
import Axis, { AxisOrientation } from './Axis';
import { DomPlotContext } from '../../PlotContext';

export type AnyScale =
  ScaleContinuousNumeric<number, number>
  | ScaleBand<any>
  | ScalePoint<any>;

interface Props {
  leftAxisScale?: AnyScale;
  leftLabel?: string;
  rightAxisScale?: AnyScale;
  rightLabel?: string;
  topAxisScale?: AnyScale;
  topLabel?: string;
  bottomAxisScale?: AnyScale;
  bottomLabel?: string;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  containerWidth: number;
  containerHeight: number;
}

const isContinuousNumeric = (scale: AnyScale): scale is ScaleContinuousNumeric<number, number> =>
  scale.domain().length === 2 && typeof scale.domain()[0] === 'number';

const getTransformedScale = (
  scale: AnyScale,
  translate: number,
  scaleFactor: number,
  rangeLength: number,
) => {
  if (!scale) return null;
  const newScale = scale.copy();
  if (isContinuousNumeric(scale)) {
    const newRange = scale.range();
    if (newRange[0] === 0) {
      newRange[1] = rangeLength;
    } else {
      newRange[0] = rangeLength;
    }
    newScale.range(newRange);
    // We have a continuous domain
    const newDomain = scale.domain();
    newDomain[0] = scale.invert((newRange[0] - translate) / scaleFactor);
    newDomain[1] = scale.invert((newRange[1] - translate) / scaleFactor);
    newScale.domain(newDomain);
  } else {
    const newRange = scale.range();
    newRange[0] *= scaleFactor;
    newRange[0] += translate;
    newRange[1] *= scaleFactor;
    newRange[1] += translate;
    newScale.range(newRange);
  }
  return newScale;

};

const PlotAxes: React.SFC<Props> = (props) => {
  const {
    state: {
      draggablePosition,
      zoomablePosition,
      zoomableScale,
    },
  } = React.useContext(DomPlotContext);

  const {
    leftLabel, rightLabel, topLabel, bottomLabel,
    marginLeft, marginRight, marginTop, marginBottom,
    containerHeight, containerWidth,
  } = props;

  const leftAxisScale = getTransformedScale(
    props.leftAxisScale,
    draggablePosition.y + zoomablePosition.y,
    zoomableScale.y,
    containerHeight - marginTop - marginBottom,
  );

  const rightAxisScale = getTransformedScale(
    props.rightAxisScale,
    draggablePosition.y + zoomablePosition.y,
    zoomableScale.y,
    containerHeight - marginTop - marginBottom,
  );

  const topAxisScale = getTransformedScale(
    props.topAxisScale,
    draggablePosition.x + zoomablePosition.x,
    zoomableScale.x,
    containerWidth - marginLeft - marginRight,
  );

  const bottomAxisScale = getTransformedScale(
    props.bottomAxisScale,
    draggablePosition.x + zoomablePosition.x,
    zoomableScale.x,
    containerWidth - marginLeft - marginRight,
  );

  let leftAxis: JSX.Element;
  let rightAxis: JSX.Element;
  let topAxis: JSX.Element;
  let bottomAxis: JSX.Element;

  if (leftAxisScale) {
    leftAxis = (
        <g transform={`translate(${marginLeft},${marginTop})`}>
          <Axis orient={AxisOrientation.LEFT} scale={leftAxisScale}/>
          {leftLabel &&
            <text
              fontSize="15"
              transform="rotate(-90)"
              x={-containerHeight / 2}
              y={-(marginLeft - 20)}
            >{leftLabel}</text>
          }
        </g>);
  }

  if (rightAxisScale) {
    rightAxis = (
      <g transform={`translate(${containerWidth - marginRight},${marginTop})`}>
        <Axis orient={AxisOrientation.RIGHT} scale={rightAxisScale}/>
        {rightLabel &&
          <text
            fontSize="15"
            transform="rotate(-90)"
            x={-containerHeight / 2}
            y={marginRight - 10}
          >{rightLabel}</text>
        }
      </g >);
  }

  if (topAxisScale) {
    topAxis = (
      <g transform={`translate(${marginLeft},${marginTop})`}>
      <Axis orient={AxisOrientation.TOP} scale={topAxisScale}/>
      {topLabel &&
        <text
          fontSize="15"
          textAnchor="middle"
          x={(containerWidth - marginLeft - marginRight) / 2}
          y={-20}
        >{topLabel}</text>
      }
    </g >);
  }

  if (bottomAxisScale) {
    bottomAxis = (
      <g transform={`translate(${marginLeft},${containerHeight - marginBottom})`}>
      <Axis orient={AxisOrientation.BOTTOM} scale={bottomAxisScale}/>
      {bottomLabel &&
        <text
          fontSize="15"
          textAnchor="middle"
          x={(containerWidth - marginLeft - marginRight) / 2}
          y={marginBottom - 10}
        >{bottomLabel}</text>
      }
    </g >);
  }

  return (
      <svg
        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
        width={containerWidth}
        height={containerHeight}
      >
        {leftAxis}
        {rightAxis}
        {topAxis}
        {bottomAxis}
      </svg>
  );
};

export default PlotAxes;
