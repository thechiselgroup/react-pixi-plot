import * as PIXI from 'pixi.js';
import { CustomPIXIComponent, Behavior, SpriteProperties } from 'react-pixi-fiber';
import { zoomEventEmitter } from './ZoomableContainer';
import { hasParent } from '../../utils';

interface RescalingSpriteProperties extends SpriteProperties {
  pixelWidth: number;
  pixelHeight: number;
}

interface RescalingSprite extends PIXI.Sprite {
  _pixelWidth: number;
  _pixelHeight: number;
}

class RescalingSpriteBehavior implements Behavior<RescalingSpriteProperties, RescalingSprite> {
  attachedSprites: Set<RescalingSprite>;

  constructor() {
    this.attachedSprites = new Set();
    zoomEventEmitter.on('zoom', this.rescaleSprites);
  }

  customDisplayObject = (props: RescalingSpriteProperties) => {
    const s =  new PIXI.Sprite(props.texture) as RescalingSprite;
    s._pixelHeight = props.pixelHeight;
    s._pixelWidth = props.pixelWidth;
    return s;
  }

  customDidAttach = (s: RescalingSprite) => {
    this.attachedSprites.add(s);
  }

  customWillDetach = (s: RescalingSprite) => {
    this.attachedSprites.delete(s);

  }

  rescaleSprites = (zoomingContainer: PIXI.Container) => {
    this.attachedSprites.forEach((s) => {
      if (!hasParent(s, zoomingContainer)) {
        return;
      }

      const { a: xScale, d: yScale } = s.parent.worldTransform;
      const nextXScale = s._pixelWidth / (xScale * s.texture.width);
      const nextYScale = s._pixelHeight / (yScale * s.texture.height);
      if (s.scale.x !== nextXScale || s.scale.y !== nextYScale) {
        s.scale.set(nextXScale, nextYScale);

      }
    });
  }
}

export default CustomPIXIComponent(new RescalingSpriteBehavior, 'RescalingSprite');
