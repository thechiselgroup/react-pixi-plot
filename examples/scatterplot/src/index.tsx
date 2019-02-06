import { render } from 'react-dom';
import * as PIXI from 'pixi.js';
import React from 'react';
import countries from './countries.json';
import { PixiPlot } from '../../../src';
import white_circle from './white_circle.png';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { Sprite } from 'react-pixi-fiber';

const PLOT_SIZE = {
  width: 500,
  height: 300,
};

PIXI.loader.add('circle', white_circle);
PIXI.loader.load(() => {
  const xScale = scaleLinear()
    .domain(extent(countries, (c: any) => c.NetMigration as number)).range([0, 500]);
  console.log(xScale.domain());
  const yScale = scaleLinear()
    .domain(extent(countries, (c: any) => c.Literacy as number)).range([300, 0]);
  const displayObjectsBounds = new PIXI.Rectangle(0, 0, 500, 300);

  const displayObjects = countries.map((country) => {
    return <Sprite
      key={country.Name}
      texture={PIXI.loader.resources.circle.texture}
      position={new PIXI.Point(xScale(country.NetMigration), yScale(country.Literacy))}
      width={10}
      height={10}
      tint={0xFF0000}
    />;
  });

  console.log(displayObjects);

  render(
  <PixiPlot
    size={PLOT_SIZE}
    displayObjectsBounds={displayObjectsBounds}>
    {displayObjects}
  </PixiPlot>,
  document.getElementById('container'));
});
