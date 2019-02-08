import { render } from 'react-dom';
import * as PIXI from 'pixi.js';
import React from 'react';
import countries from './countries.json';
import { PixiPlot } from '../../../src';
import white_circle from './white_circle.png';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { RescalingSprite, DraggableContainer, ZoomableContainer } from '../../../src/';

const PLOT_SIZE = {
  width: 500,
  height: 300,
};

PIXI.loader.add('circle', white_circle);
PIXI.loader.load(() => {
  const xScale = scaleLinear()
    .domain(extent(countries, (c: any) => c.NetMigration as number)).range([0, 500]);
  const yScale = scaleLinear()
    .domain(extent(countries, (c: any) => c.Literacy as number)).range([300, 0]);

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
  <PixiPlot size={PLOT_SIZE}>
    <DraggableContainer>
      <ZoomableContainer>
        {displayObjects}
      </ZoomableContainer>
    </DraggableContainer>
  </PixiPlot>,
  document.getElementById('container'));
});
