import { render } from 'react-dom';
import * as PIXI from 'pixi.js';
import React from 'react';
import countries from './countries.json';
import { PixiPlot } from '../../../src';
import white_circle from './white_circle.png';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { RescalingSprite, DraggableContainer, ZoomableContainer } from '../../../src/';

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
    <div style={{
      marginLeft:'25%', marginRight:'25%', marginTop: 50, marginBottom: 50,
      border: '1px solid black',
    }}>
      <PixiPlot
        leftAxisScale={yScale} leftLabel={'Literacy'}
        rendererMargins={{ left:50, right:0, top:0, bottom:0 }}
      >
        <DraggableContainer>
          <ZoomableContainer>
            {displayObjects}
          </ZoomableContainer>
        </DraggableContainer>
      </PixiPlot>
      <PixiPlot
        leftAxisScale={yScale} leftLabel={'Literacy'}
        rendererMargins={{ left:50, right:0, top:0, bottom:0 }}
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
