import { CustomPIXIComponent } from 'react-pixi-fiber';
import Viewport from 'pixi-viewport';

const TYPE = 'Viewport';
const behavior = {
  customDisplayObject: props => {
    console.log('built viewport');
    return new Viewport({
      screenWidth: props.app.renderer.width,
      screenHeight: props.app.renderer.height,
      worldWidth: 1000,
      worldHeight: 1000,
      interaction: props.app.renderer.plugins.interaction,
    });
  },
  customDidAttach: (instance: Viewport) => {
    console.log('attached');
    instance.drag()
      .pinch()
      .wheel()
      .decelerate();

    instance.on('wheel', () => console.log('wheeeeel'));
  },

};

export default CustomPIXIComponent(behavior, TYPE);
