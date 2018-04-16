
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
