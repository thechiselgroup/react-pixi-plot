import * as PIXI from 'pixi.js'
import SVGGraphics from './SVGGraphics'

export interface Tints {
	[index: string]: number
}

export interface SelectEvent {
	pixelBounds: PIXI.Rectangle
	plotBounds: PIXI.Rectangle
	addToSelection: boolean,
	removeFromSelection: boolean,
	isBrushing: boolean,
	nativeEvent: MouseEvent
}

export interface HoverEvent {
	pixelBounds: PIXI.Rectangle
	plotBounds: PIXI.Rectangle,
	isBrushing: boolean,
	nativeEvent: MouseEvent
}

export interface TintedSVGGraphics extends SVGGraphics {
	colorValue: any,
	tints: Tints,
}

export interface TintedGraphics extends PIXI.Graphics {
	colorValue: any,
	tints: Tints,
}

export interface TintedSprite extends PIXI.Sprite {
	tints: Tints,
	colorValue: any
}
