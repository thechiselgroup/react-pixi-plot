import {render} from 'react-dom'
import * as PIXI from 'pixi.js'
import React from 'react'
import countries from './countries.json'
import {PixiPlot} from '@thechiselgroup/react-pixi-plot'
import white_circle from './white_circle.png'
import {scaleLinear} from 'd3-scale'
import {extent} from 'd3-array'

const PLOT_SIZE = {
	width: 500,
	height: 300
}

PIXI.loader.add('circle', white_circle)
PIXI.loader.load(() => {
	const xScale = scaleLinear().domain(extent(countries, (c: any) => c.NetMigration as number)).range([0, 500])
	console.log(xScale.domain())
	const yScale = scaleLinear().domain(extent(countries, (c: any) => c.Literacy as number)).range([300, 0])
	const displayObjectsBounds = new PIXI.Rectangle(0, 0, 500, 300)

	const displayObjects = countries.map((country) => {
		const sprite = new PIXI.Sprite(PIXI.loader.resources.circle.texture)
		sprite.position.set(xScale(country.NetMigration), yScale(country.Literacy))
		sprite.width = 10
		sprite.height = 10
		sprite.tint = 0xFF0000

		return sprite
	})

	console.log(displayObjects)


	render(<PixiPlot displayObjects={displayObjects} size={PLOT_SIZE} displayObjectsBounds={displayObjectsBounds}/>, document.getElementById('container'))
})


