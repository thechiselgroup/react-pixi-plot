# React Pixi Plot - Make interactive plots with React and WebGL

ReactPixiPlot is a Javascript library for writing PixiJS plots using React declarative style. It relies on `react-pixi-fiber` to render the plot

## Usage

```jsx
import { render } from 'react-dom';
import * as PIXI from 'pixi.js';
import React from 'react';
import countries from './countries.json';
import white_circle from './white_circle.png';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import {
	PixiPlot, RescalingSprite,
  DraggableContainer, ZoomableContainer
} from 'react-pixi-plot';

PIXI.loader.add('circle', white_circle);
PIXI.loader.load(() => {
  const xScale = scaleLinear()
    .domain(extent(countries, (c: any) => c.NetMigration as number)).range([0, 100]);
  const yScale = scaleLinear()
    .domain(extent(countries, (c: any) => c.Literacy as number)).range([100, 0]);

  const displayObjects = countries.map((country) => {
    return <RescalingSprite
      key={country.Name}
      texture={PIXI.loader.resources.circle.texture}
      position={new PIXI.Point(xScale(country.NetMigration), yScale(country.Literacy))}
      pixelWidth={10}
      pixelHeight={10}
      tint={0xFF0000}
    />;
  });

  render(
    <div style={{
      marginLeft:'25%', marginRight:'25%', marginTop: 50, marginBottom: 50,
      border: '1px solid black', height: '100%', display: 'flex',
    }}>
      <PixiPlot
        leftAxisScale={yScale} leftLabel={'Literacy'}
        bottomAxisScale={xScale} bottomLabel={'Net Migration'}
        rendererMargins={{ left:50, right:50, top:50, bottom:50 }}
      >
        <DraggableContainer>
          <ZoomableContainer>
            {displayObjects}
          </ZoomableContainer>
        </DraggableContainer>
      </PixiPlot>
    </div>
    ,
    document.getElementById('container'));
});
```

## Components

This library provides the following components allowing for the easy creation of an interactive plot.

### `<PixiPlot />`

```js
import {PixiPlot} from 'react-pixi-plot';
```

`PixiPlot` is the main component to use to render a plot. It will render a PIXI.js `canvas`, using the `react-pixi-fiber` `Stage` component.

Children of a `PixiPlot` element are rendered using `react-pixi-fiber`, and thus must be components from that library, one of the components below, or a [`customPIXIComponent`](https://github.com/michalochman/react-pixi-fiber#custom-components).

`PixiPlot` allows you to render axes around the plot, using `d3` scales. The following props can be given to `PixiPlot`:

```ts
type AnyScale =
  ScaleContinuousNumeric<number, number>
  | ScaleBand<any>
  | ScalePoint<any>;

interface PixiPlotProps {
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
  readonly rendererMargins?: {
    left: number, right: number, top: number, bottom: number
  };
}
```

### `<DraggableContainer />`

```js
import {DraggableContainer} from 'react-pixi-plot';
```

A simple PIXI container that makes the viewport draggable by using the mouse right click.

### `<ZoomableContainer />`

```js
import {ZoomableContainer} from 'react-pixi-plot';
```

A PIXI container that makes the viewport zoomable by scrolling. If used in combination with `DraggableContainer`, `ZoomableContainer` should be a child of `DraggableContainer`.

### `<SelectionContainer />`

```js
import {SelectionContainer} from 'react-pixi-plot';
```

A container that captures mouse interactions such as selection (left click), hovering, and brushing (click and drag). During brushing operations, an optional selection overlay can be rendered.

### `<RescalingSprite />`

```js
import {RescalingSprite} from 'react-pixi-plot';
```

To be used in combination with a `ZoomableContainer`, this sprite always renders with the same height and width in pixels. Useful for instance for scatterplots, allowing you to get more detail values when zooming without ending up with very large sprites.

### `<SVGContainer />`

```js
import {SVGContainer} from 'react-pixi-plot';
```

A container that will reproduce the contents of an SVG HTML element with one or more `PIXI.Graphics`.
