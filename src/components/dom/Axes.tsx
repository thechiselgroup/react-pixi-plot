import React from 'react';
import { ScaleBand, ScaleContinuousNumeric, ScaleOrdinal, ScalePoint } from 'd3-scale';
import Axis, { AxisOrientation } from './Axis';
import { zoomEventEmitter } from '../pixi/ZoomableContainer';

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

interface State {
  xScale: number;
  yScale: number;
  leftAxisScale?: AnyScale;
  rightAxisScale?: AnyScale;
  topAxisScale?: AnyScale;
  bottomAxisScale?: AnyScale;
}

class PlotAxes extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    zoomEventEmitter.on('zoom', this.handleZoom);
    this.state = {
      xScale: 1,
      yScale: 1,
      leftAxisScale: props.leftAxisScale,
    };
  }

  handleZoom = (zoomableContainer: PIXI.Container) => {
    const { leftAxisScale } = this.props;
    const { x: xScale, y: yScale } = zoomableContainer.scale;
    const leftRange = [leftAxisScale.range()[0] * yScale, leftAxisScale.range()[1]];
    const newLeftScale = leftAxisScale.copy().range(leftRange) as AnyScale;
    this.setState({
      xScale,
      yScale,
      leftAxisScale: newLeftScale,
    });
  }

  render() {
    const {
      leftLabel,
      marginLeft, marginTop, containerHeight, containerWidth,
    } = this.props;
    const { leftAxisScale } = this.state;
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
  }
}

export default PlotAxes;
