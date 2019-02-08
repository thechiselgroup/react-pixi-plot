
export const hasParent = (child: PIXI.DisplayObject, parent: PIXI.DisplayObject) => {
  let e = child;
  while (e.parent) {
    if (e.parent === parent) return true;
    e = e.parent;
  }
  return false;
};
