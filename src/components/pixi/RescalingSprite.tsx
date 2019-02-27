import React from 'react';
import * as PIXI from 'pixi.js';
import { SpriteProperties, Sprite } from 'react-pixi-fiber';
import { PixiPlotContext } from '../../PlotContext';

interface WrapperProps extends SpriteProperties {
  pixelWidth: number;
  pixelHeight: number;
}

interface Props extends WrapperProps {
  parentScale: {x: number, y: number};
}

interface State {
  scale: PIXI.Point;
}

class RescalingPIXI extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      scale: this.getScale(),
    };
  }

  getScale() {
    const { x, y } = this.props.parentScale;
    const { pixelWidth, pixelHeight, texture } = this.props;
    const nextXScale = pixelWidth / (x * texture.width);
    const nextYScale = pixelHeight / (y * texture.height);
    return new PIXI.Point(nextXScale, nextYScale);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.parentScale !== this.props.parentScale) {
      this.setState({
        scale : this.getScale(),
      });
    }
  }

  render() {
    const { scale } = this.state;

    return <Sprite {...this.props} scale={scale} />;
  }
}

const RescalingSprite: React.SFC<WrapperProps> = props =>
  <PixiPlotContext.Consumer>
    { ({ state }) => <RescalingPIXI parentScale={state.zoomableScale} {...props}/>}
  </PixiPlotContext.Consumer>;

export default RescalingSprite;
