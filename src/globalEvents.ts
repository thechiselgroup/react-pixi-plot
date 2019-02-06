/**
 * Sets DOM body style pointerEvents to 'none' to prevent global mouse events.
 */
export const preventGlobalMouseEvents = () => {
  document.body.style.pointerEvents = 'none';
};

/**
 * Sets DOM body style pointerEvents to 'auto' to restore global mouse events.
 */
export const restoreGlobalMouseEvents = () => {
  document.body.style.pointerEvents = 'auto';
};
