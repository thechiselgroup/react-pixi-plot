
import { ScaleContinuousNumeric, ScaleOrdinal, ScaleBand, ScalePoint } from 'd3-scale';
import React, { Component } from 'react';
import * as d3Axis from 'd3-axis';
import { select as d3Select } from 'd3-selection';

export enum AxisOrientation {
  TOP = 'Top',
  RIGHT = 'Right',
  BOTTOM = 'Bottom',
  LEFT = 'Left',
}

interface Props {
  orient: AxisOrientation;
  transform?: string;
  scale: ScaleContinuousNumeric<number, number>
  | ScaleBand<any>
  | ScaleOrdinal<any, number>
  | ScalePoint<any>;
  tickValues?: number[] | string[];
  numTicks?: number;
  ticksRotate?: number;
}

export default class Axis extends Component<Props> {
  static defaultProps = {
    numTicks: 10,
  };

  axisElement: SVGGElement | null;

  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  renderAxis() {
    const { orient, tickValues, scale, numTicks, ticksRotate } = this.props;
    const axisType = `axis${orient}` as
      'axisLeft'
      | 'axisBottom'
      | 'axisTop'
      | 'axisRight';

    const axis = d3Axis[axisType](scale)
    .tickSize(3).ticks(numTicks).tickValues(tickValues);

    const selection = d3Select(this.axisElement).call(axis);
    if (ticksRotate) {
      selection.selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', `rotate(${ticksRotate})`);
    }
  }

  render() {
    return <g ref={(el) => { this.axisElement = el; }} transform={this.props.transform} />;
  }
}
