/**
 * A simple distance calculation between two cartesian objects with x and y parameters.
 */
export const distance = (a: PIXI.Point, b: PIXI.Point) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
