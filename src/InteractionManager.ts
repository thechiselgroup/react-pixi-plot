import React from 'react'
import {SelectEvent, HoverEvent} from './types'
import normalizeWheel from 'normalize-wheel'

export interface Props {
	pixiInteractionManager?: PIXI.interaction.InteractionManager
	children: JSX.Element

	/**
	 * This callback is invoked whenever the user clicks or brushes on the visualization.
 	 */
	onSelect: (e: SelectEvent) => void

	/**
	 * This callback is invoked whenever the user hovers on the visualization, or while brushing.
	 */
	onHover: (e: HoverEvent) => void

	onPan: (from: PIXI.Point, to: PIXI.Point) => void

	onZoom: (factor: number, mousePosition: PIXI.Point) => void

	plotSize: {width: number, height: number}
}

const MIN_DRAG_DISTANCE = 3
const LEFT_BUTTON = 0
const RIGHT_BUTTON = 2

export default class InteractionManager extends React.PureComponent<Props> {

	panAnchorPoint?: PIXI.Point
	selectStart?: PIXI.Point
	addToSelection?: boolean
	removeFromSelection?: boolean
	pinchDistance?: number

	/**
	 * A simple distance calculation between two cartesian objects with x and y parameters.
	 * @method
	 * @param {object} a The first cartesian point.
	 * @param {object} b The second cartesian point.
	 * @returns {number} The magnitude of the linear distance between a and b.
	 */
	distance = (a: PIXI.Point, b: PIXI.Point) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

	/**
	 * Sets DOM body style pointerEvents to 'none' to prevent global mouse events. Paired with {@link InteractionManager#restoreGlobalMouseEvents|restoreGlobalMouseEvents}.
	 * @method
	 * @returns {undefined}
	 */
	preventGlobalMouseEvents = () => {
		document.body.style.pointerEvents = 'none'
	}

	/**
	 * Sets DOM body style pointerEvents to 'auto' to restore global mouse events. Paired with {@link InteractionManager#preventGlobalMouseEvents|preventGlobalMouseEvents}.
	 * @method
	 * @returns {undefined}
	 */
	restoreGlobalMouseEvents = () => {
		document.body.style.pointerEvents = 'auto'
	}

	/**
	 * Handles all mouse down events.
	 * When using the left mouse button checks if shift or control keys (e.shiftKey, e.ctrlKey booleans) are pressed to know if a selection add or remove is occuring.
	 * When using the right mouse button performs a pan of the visualization.
	 * @method
	 * @param {object} e The mouse down event.
	 * @returns {undefined}
	 */
	handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		this.captureMouseEvents(e.nativeEvent)
		if (e.button === LEFT_BUTTON) {
			this.selectStart = this.eventRendererPosition(e)
			this.addToSelection = e.shiftKey
			this.removeFromSelection = e.ctrlKey
		} else if (e.button === RIGHT_BUTTON) {
			this.panAnchorPoint = this.eventRendererPosition(e)
		}
	}

	/**
	 * @todo stop the preventDefault for contextmenu event listener from preventing right clicking in the entire Lodestone application.
	 * Isolates mouse events to the visualization by adding event listeners and preventing mouse defaults and event propagation. Handles cancelling the right mouse context menu.
	 * @method
	 * @param {object} e The mouse event.
	 * @returns {undefined}
	 */
	captureMouseEvents = (e: MouseEvent) => {
		this.preventGlobalMouseEvents()
		document.addEventListener('mouseup', this.mouseUpListener, true)
		document.addEventListener('mousemove', this.mouseMoveListener, true)
		document.addEventListener('contextmenu', (ev) => ev.preventDefault(), true)
		e.preventDefault()
		e.stopPropagation()
	}

	/**
	 * Handles mouse button release. Restores event listeners that were removed during {@link PixiVisualization#captureMouseEvents|captureMouseEvents},
	 * enables holding shift and selecting more points, and removing points from selections with the right mouse button.
	 * @method
	 * @param {object} e The mouse up event.
	 * @returns {undefined}
	 */
	mouseUpListener = (e: MouseEvent) => {
		this.restoreGlobalMouseEvents()
		document.removeEventListener('mouseup', this.mouseUpListener, true)
		document.removeEventListener('mousemove', this.mouseMoveListener, true)
		document.removeEventListener('contextmenu', (ev) => ev.preventDefault(), true)
		e.preventDefault()
		if (e.button === LEFT_BUTTON && this.selectStart) {

			let mousePosition = this.eventRendererPosition(e)
			if (this.distance(this.selectStart, mousePosition) >= MIN_DRAG_DISTANCE) {
				// change mousePosition to be within the canvas size

				mousePosition = this.constrainMousePosition(mousePosition)
				const pixelBounds = new PIXI.Rectangle(
					Math.min(this.selectStart.x, mousePosition.x),
					Math.min(this.selectStart.y, mousePosition.y),
					Math.abs(this.selectStart.x - mousePosition.x),
					Math.abs(this.selectStart.y - mousePosition.y)
				)

				this.props.onSelect({
					pixelBounds,
					plotBounds: new PIXI.Rectangle(),
					addToSelection: e.ctrlKey,
					removeFromSelection: e.shiftKey,
					isBrushing: true,
					nativeEvent: e
				})
				delete this.addToSelection
				delete this.removeFromSelection
			} else {
				this.props.onSelect({
					pixelBounds: new PIXI.Rectangle(mousePosition.x, mousePosition.y),
					plotBounds: new PIXI.Rectangle(),
					addToSelection: e.ctrlKey,
					removeFromSelection: e.shiftKey,
					isBrushing: false,
					nativeEvent: e
				})
			}
			delete this.selectStart
		} else if (e.button === RIGHT_BUTTON) {
			delete this.panAnchorPoint
		}
	}

	handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		if (e.targetTouches.length === 1)
			this.panAnchorPoint = this.eventRendererPosition(e.targetTouches.item(0))
		else {
			if (this.panAnchorPoint)
				delete this.panAnchorPoint
			if (e.targetTouches.length === 2) {
				const a = this.eventRendererPosition(e.targetTouches.item(0))
				const b = this.eventRendererPosition(e.targetTouches.item(1))
				this.pinchDistance = this.distance(a, b)
			}
		}
	}

	handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
		if (e.targetTouches.length === 0) // no more touches
			delete this.panAnchorPoint
		else if (e.targetTouches.length === 1) {
			delete this.pinchDistance
		}
	}

	handleTouchMove = (e: React.TouchEvent<HTMLDivElement> ) => {
		if (e.targetTouches.length === 1) {
			const touch = e.targetTouches.item(0)
			const touchPosition = this.eventRendererPosition(touch)
			if (this.panAnchorPoint !== undefined) {
				this.props.onPan(this.panAnchorPoint, touchPosition)
				this.panAnchorPoint = touchPosition
			}

		} else if (e.targetTouches.length === 2) {
			const a = this.eventRendererPosition(e.targetTouches.item(0))
			const b = this.eventRendererPosition(e.targetTouches.item(1))
			const newPinchDistance = this.distance(a, b)
			this.props.onZoom(newPinchDistance / this.pinchDistance, a)
		}
	}

	/**
	 * Handles mouse movement events. If a selection has already been started this handles expanding the selection, and handles panning to the new position if a pan is occuring.
	 * @method
	 * @param {object} e The mouse move event.
	 * @returns {undefined}
	 */
	mouseMoveListener = (e: MouseEvent) => {
		e.stopPropagation()
		e.preventDefault()
		let mousePosition = this.eventRendererPosition(e)
		if (this.panAnchorPoint !== undefined) {
			this.props.onPan(this.panAnchorPoint, mousePosition)
			this.panAnchorPoint = mousePosition
		}

		if (this.selectStart !== undefined) {
			// change mousePosition to be within the canvas size.
			mousePosition = this.constrainMousePosition(mousePosition)
			const pixelBounds = new PIXI.Rectangle(
				Math.min(this.selectStart.x, mousePosition.x),
				Math.min(this.selectStart.y, mousePosition.y),
				Math.abs(this.selectStart.x - mousePosition.x),
				Math.abs(this.selectStart.y - mousePosition.y)
			)

			this.props.onHover({
				pixelBounds,
				plotBounds: new PIXI.Rectangle(),
				isBrushing: true,
				nativeEvent: e
			})
		}
	}

	/**
	 * Handles keeping the mouse within the canvas if a mouse-based interaction is occuring.
	 * @method
	 * @param {object} mousePosition Where the mouse is currently.
	 * @returns {object} Where we have constrained the mouse to be.
	 */
	constrainMousePosition = (mousePosition: PIXI.Point) => {
		const {plotSize: {width, height}} = this.props
		const x = mousePosition.x
		const y = mousePosition.y
		if (x < 0) mousePosition.x = 0
		else if (x > width) mousePosition.x = width
		if (y < 0) mousePosition.y = 0
		else if (y > height) mousePosition.y = height
		return mousePosition
	}

	/**
	 * Handles moving the mouse. Determines the mouse's position and if the ctrl key isn't pressed we hover the data under the mouse cursor.
	 * @method
	 * @param {object} e The mouse move event.
	 * @returns {undefined}
	 */
	handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const mousePosition = this.eventRendererPosition(e)
		if (!e.ctrlKey) this.props.onHover({
			pixelBounds: new PIXI.Rectangle(mousePosition.x, mousePosition.y),
			plotBounds: new PIXI.Rectangle(),
			isBrushing: false,
			nativeEvent: e.nativeEvent
		})
	}

	/**
	 * Handles whenever someone scrolls the mouse wheel. We generate the zoom factor, and prevent the website from reacting normally to a mouse scroll (scolling down the page).
	 * @method
	 * @param {object} e The mouse wheel event.
	 * @returns {undefined}
	 */
	handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		const normalizedEvent = normalizeWheel(e)
		this.props.onZoom(Math.pow(2, -normalizedEvent.pixelY / 500), this.eventRendererPosition(e))
		e.stopPropagation()
		e.preventDefault()
	}

	/**
	 * Correlates clicks on the renderer that happen in screen space coordinates to renderer coordinates. Used to understand where the mouse event occurred inside the renderer.
	 * @method
	 * @param {MouseEvent} mouseEvent The mouse event.
	 * @returns {PIXI.Point} The Point object containing the coordinates of the mouse, in the renderer's coordinates system.
	 */
	eventRendererPosition(mouseEvent: MouseEvent | React.MouseEvent<HTMLDivElement> | React.Touch) {
		const mousePosition = new PIXI.Point()
		this.props.pixiInteractionManager.mapPositionToPoint(mousePosition, mouseEvent.clientX, mouseEvent.clientY)
		return mousePosition
	}

	render() {
		return React.cloneElement(this.props.children, {
			onMouseDown: this.handleMouseDown,
			onWheel: this.handleWheel,
			onMouseMove: this.handleMouseMove,
			onTouchStart: this.handleTouchStart,
			onTouchEnd: this.handleTouchEnd,
			onTouchMove: this.handleTouchMove
		})
	}

}
