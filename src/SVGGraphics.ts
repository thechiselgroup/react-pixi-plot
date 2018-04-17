import color2color from 'colorcolor'
import * as PIXI from 'pixi.js'

export default class SVGGraphics extends PIXI.Container {
	svgElement: HTMLElement
	_lineWidthScale: number
	_tint: number
	constructor(svgElement: HTMLElement, lineWidthScale = 1) {
		super()
		this.svgElement = svgElement
		this._lineWidthScale = lineWidthScale
		const children = svgElement.children || svgElement.childNodes
		for (let i = 0, len = children.length; i < len; i++) {
			if (children[i].nodeType !== 1) { continue }
			this.drawNode(children[i] as SVGElement)
		}
	}

	set lineWidthScale(s: number) {
		this._lineWidthScale = s
		this.removeChildren()
		const children = this.svgElement.children || this.svgElement.childNodes
		for (let i = 0, len = children.length; i < len; i++) {
			if (children[i].nodeType !== 1) { continue }
			this.drawNode(children[i] as SVGElement)
		}
		this.tint = this._tint
	}

	get lineWidthScale() {
		return this._lineWidthScale
	}

	set tint(t: number) {
		for (const child of this.children as PIXI.Graphics[]) {
			child.tint = t
		}
		this._tint = t
	}

	get tint() {
		return this._tint
	}

	containsPoint = (p: PIXI.Point) => {
		for (const g of this.children as PIXI.Graphics[]) {
			if (g.hitArea && g.hitArea.contains(p.x, p.y))
				return true
		}
		return false
	}

	drawNode = (node: SVGElement) => {
		const tagName = node.tagName
		const capitalizedTagName = tagName.charAt(0).toUpperCase() + tagName.slice(1).toLowerCase()
		if (!this['draw' + capitalizedTagName + 'Node']) {
			console.warn('No drawing behavior for ' + capitalizedTagName + ' node')
		} else {
			this['draw' + capitalizedTagName + 'Node'](node)
		}
	}

	/**
	* Draws the given root SVG node (and handles it as a group)
	* @param  {SVGSVGElement} node
	*/
	drawSvgNode = function(node) {
		this.drawGNode(node)
	}

	/**
	* Draws the given group svg node
	* @param  {SVGGroupElement} node
	*/
	drawGNode = function(node) {
		const children = node.children || node.childNodes
		let child
		for (let i = 0, len = children.length; i < len; i++) {
			child = children[i]
			if (child.nodeType !== 1) { continue }
			this.drawNode(child)
		}
	}

	/**
	* Draws the given line svg node
	* @param  {SVGLineElement} node
	*/
	drawLineNode = function(node) {
		const graphics = new PIXI.Graphics()
		this.applySvgAttributes(graphics, node)

		const x1 = parseFloat(node.getAttribute('x1'))
		const y1 = parseFloat(node.getAttribute('y1'))
		const x2 = parseFloat(node.getAttribute('x2'))
		const y2 = parseFloat(node.getAttribute('y2'))

		graphics.moveTo(x1, y1)
		graphics.lineTo(x2, y2)
		this.addChild(graphics)
	}

	/**
	* Draws the given polyline svg node
	* @param  {SVGPolylineElement} node
	*/
	drawPolylineNode = function(node) {
		const graphics = new PIXI.Graphics()
		this.applySvgAttributes(graphics, node)

		const reg = '(-?[\\d\\.?]+),(-?[\\d\\.?]+)'
		const points = node.getAttribute('points').match(new RegExp(reg, 'g'))

		let point
		for (let i = 0, len = points.length; i < len; i++) {
			point = points[i]
			const coords = point.match(new RegExp(reg))

			coords[1] = parseFloat(coords[1])
			coords[2] = parseFloat(coords[2])

			if (i === 0) {
				graphics.moveTo(coords[1], coords[2])
			} else {
				graphics.lineTo(coords[1], coords[2])
			}
		}
		this.addChild(graphics)
	}

	/**
	* Draws the given circle node
	* @param  {SVGCircleElement} node
	*/
	drawCircleNode = function(node) {
		const graphics = new PIXI.Graphics()
		this.applySvgAttributes(graphics, node)

		const cx = parseFloat(node.getAttribute('cx'))
		const cy = parseFloat(node.getAttribute('cy'))
		const r = parseFloat(node.getAttribute('r'))

		graphics.drawCircle(cx, cy, r)
		this.addChild(graphics)
	}

	/**
	* Draws the given ellipse node
	* @param  {SVGCircleElement} node
	*/
	drawEllipseNode = function(node) {
		const graphics = new PIXI.Graphics()
		this.applySvgAttributes(graphics, node)

		const cx = parseFloat(node.getAttribute('cx'))
		const cy = parseFloat(node.getAttribute('cy'))
		const rx = parseFloat(node.getAttribute('rx'))
		const ry = parseFloat(node.getAttribute('ry'))

		graphics.drawEllipse(cx, cy, rx, ry)
		this.addChild(graphics)
	}

	/**
	* Draws the given rect node
	* @param  {SVGRectElement} node
	*/
	drawRectNode = function(node) {
		const graphics = new PIXI.Graphics()
		this.applySvgAttributes(graphics, node)

		const x = parseFloat(node.getAttribute('x'))
		const y = parseFloat(node.getAttribute('y'))
		const width = parseFloat(node.getAttribute('width'))
		const height = parseFloat(node.getAttribute('height'))

		graphics.drawRect(x, y, width, height)
		this.addChild(graphics)
	}

	/**
	* Draws the given polygon node
	* @param  {SVGPolygonElement} node
	*/
	drawPolygonNode = function(node) {
		const graphics = new PIXI.Graphics()
		this.applySvgAttributes(graphics, node)

		const reg = '(-?[\\d\\.?]+),(-?[\\d\\.?]+)'
		const points = node.getAttribute('points').match(new RegExp(reg, 'g'))

		const path = []
		let point
		for (let i = 0, len = points.length; i < len; i++) {
			point = points[i]
			const coords = point.match(new RegExp(reg))

			coords[1] = parseFloat(coords[1])
			coords[2] = parseFloat(coords[2])

			path.push(new PIXI.Point(
				coords[1],
				coords[2]
			))
		}

		graphics.drawPolygon(path)
		this.addChild(graphics)
	}

	addHitAreaAroundLine(g: PIXI.Graphics) {
		const pointsA = g.currentPath.shape.points as number[]
		const pointsB = pointsA.slice()

		for (let i = 1; i < pointsA.length; i += 2) {
			pointsA[i]++
			pointsB[i]--
		}

		g.hitArea = new PIXI.Polygon(pointsA.concat(pointsB))
	}

	/**
	* Draws the given path svg node
	* @param  {SVGPathElement} node
	*/
	drawPathNode = function(node) {
		let graphics = new PIXI.Graphics()
		this.applySvgAttributes(graphics, node)

		const d: string = node.getAttribute('d').trim()
		const commands = d.match(/[a-df-z][^a-df-z]*/ig)
		let firstCoord
		let lastCoord
		let lastControl

		let pathIndex = 0
		let lastPathCoord

		for (let i = 0, len = commands.length; i < len; i++) {
			const command = commands[i]
			const commandType = command[0]
			const args = command.slice(1).trim().split(/[\s,]+|(?=\s?[+\-])/).map(parseFloat)

			let offset = {
				x: 0,
				y: 0
			}
			if (commandType === commandType.toLowerCase()) {
				// Relative positions
				offset = lastCoord
			}

			if (i > 0 && i % 1024 === 0 ) {
				this.addHitAreaAroundLine(graphics)
				this.addChild(graphics)
				graphics = new PIXI.Graphics()
				this.applySvgAttributes(graphics, node)
				graphics.moveTo(lastCoord.x, lastCoord.y)
			}

			switch (commandType.toLowerCase()) {
				// moveto command
				case 'm':
				args[0] += offset.x
				args[1] += offset.y

				if (pathIndex === 0) {
					// First path, just moveTo()
					graphics.moveTo(args[0], args[1])
				} else if (pathIndex === 1) {
					// Second path, use lastCoord as lastPathCoord
					lastPathCoord = {
						x: lastCoord.x,
						y: lastCoord.y
					}
				}

				if (pathIndex > 1) {
					// Move from lastCoord to lastPathCoord
					graphics.lineTo(lastPathCoord.x, lastCoord.y)
					graphics.lineTo(lastPathCoord.x, lastPathCoord.y)
				}

				if (pathIndex >= 1) {
					// Move from lastPathCoord to new coord
					graphics.lineTo(lastPathCoord.x, args[1])
					graphics.lineTo(args[0], args[1])
				}

				if (!firstCoord) {
					firstCoord = { x: args[0], y: args[1] }
				}
				lastCoord = { x: args[0], y: args[1] }
				pathIndex++
				break
				// lineto command
				case 'l':
				args[0] += offset.x
				args[1] += offset.y

				graphics.lineTo(
					args[0],
					args[1]
				)
				lastCoord = { x: args[0], y: args[1] }
				break
				// curveto command
				case 'c':
				for (let k = 0, klen = args.length; k < klen; k += 2) {
					args[k] += offset.x
					args[k + 1] += offset.y
				}

				graphics.bezierCurveTo(
					args[0],
					args[1],
					args[2],
					args[3],
					args[4],
					args[5]
				)
				lastCoord = { x: args[4], y: args[5] }
				lastControl = { x: args[2], y: args[3] }
				break
				// vertial lineto command
				case 'v':
				args[0] += offset.y

				graphics.lineTo(lastCoord.x, args[0])
				lastCoord.y = args[0]
				break
				// horizontal lineto command
				case 'h':
				args[0] += offset.x

				graphics.lineTo(args[0], lastCoord.y)
				lastCoord.x = args[0]
				break
				// quadratic curve command
				case 's':
				for (let l = 0, llen = args.length; l < llen; l += 2) {
					args[l] += offset.x
					args[l + 1] += offset.y
				}

				const rx = 2 * lastCoord.x - lastControl.x
				const ry = 2 * lastCoord.y - lastControl.y

				graphics.bezierCurveTo(
					rx,
					ry,
					args[0],
					args[1],
					args[2],
					args[3]
				)
				lastCoord = { x: args[2], y: args[3] }
				lastControl = { x: args[0], y: args[1] }
				break
				// closepath command
				case 'z':
				// Z command is handled by M
				break
				default:
				throw new Error('Could not handle path command: ' + commandType + ' ' + args.join(','))
			}
		}

		if (pathIndex > 1) {
			// Move from lastCoord to lastPathCoord
			graphics.lineTo(lastPathCoord.x, lastCoord.y)
			graphics.lineTo(lastPathCoord.x, lastPathCoord.y)
		}

		this.addHitAreaAroundLine(graphics)
		this.addChild(graphics)
	}

	/**
	* Applies the given node's attributes to our PIXI.Graphics object
	* @param  {SVGElement} node
	*/
	applySvgAttributes = (graphics, node: SVGElement) => {
		const attributes = {} as {[index: string]: string}

		// Get node attributes
		let i = node.attributes.length
		while (i--) {
			const attribute = node.attributes[i]
			attributes[attribute.name] = attribute.value
		}

		// CSS attributes override node attributes
		const style = node.getAttribute('style')
		if (style) {
			// Simply parse the inline css
			const pairs = style.split(';')
			for (let j = 0, len = pairs.length; j < len; j++) {
				const pair = pairs[j].trim()
				if (!pair) {
					continue
				}

				const split = pair.split(':', 2)
				const key = split[0].trim()
				const value = split[1].trim()
				attributes[key] = value
			}
		}
		const re = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d+(?:\.\d+)?|\.\d+)\s*\)/
		// Apply stroke style
		if (attributes.stroke) {
			let strokeColor = 0x000000
			let strokeWidth = 1 * this.lineWidthScale
			let strokeAlpha = 0

			const color = re.exec(color2color(attributes.stroke))
			strokeColor =  256 * 256 * parseInt(color[1]) + 256 * parseInt(color[2]) +  parseInt(color[3])
			strokeAlpha =  parseInt(color[4])

			if (attributes['stroke-width']) {
				strokeWidth = parseFloat(attributes['stroke-width']) * this.lineWidthScale
			}
			graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha)
		}

		// Apply fill style
		if (attributes.fill && attributes.fill !== 'none') {
			let fillColor = 0x000000
			let fillAlpha = 0
			const color = re.exec(color2color(attributes.fill, 'array'))
			fillColor = 256 * 256 * parseInt(color[1]) + 256 * parseInt(color[2]) +  parseInt(color[3])
			fillAlpha = parseInt(color[4])

			graphics.beginFill(fillColor, fillAlpha)
		}
	}
}
