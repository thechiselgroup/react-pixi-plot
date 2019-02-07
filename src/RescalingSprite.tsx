import * as PIXI from 'pixi.js';
import { CustomPIXIComponent, Behavior, SpriteProperties } from 'react-pixi-fiber';

const rescalingSpriteBehavior: Behavior<SpriteProperties, PIXI.Sprite> = {
  customDisplayObject:(props: SpriteProperties) => new PIXI.Sprite(props.texture),
};

export default CustomPIXIComponent(rescalingSpriteBehavior, 'RescalingSprite');
