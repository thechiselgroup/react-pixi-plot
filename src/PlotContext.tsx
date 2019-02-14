import React, { Dispatch } from 'react';

interface PlotState {
  draggablePosition: {x: number, y:number};
  zoomablePosition: {x: number, y: number};
  zoomableScale: {x: number, y: number};
}

const defaultState : PlotState = {
  draggablePosition: { x:0, y:0 },
  zoomablePosition: { x:0, y:0 },
  zoomableScale: { x:1, y:1 },
};

export type PixiPlotActions =
  {type: 'zoom', payload: {position: {x: number, y: number}, scale: {x: number, y: number}}} |
  {type: 'drag', payload: {position: {x: number, y: number}}};

const reducer = (state = defaultState, action: PixiPlotActions) => {

  switch (action.type) {
    case 'drag' :
      return { ...state, draggablePosition: action.payload.position };
    case 'zoom' :
      return {
        ...state,
        zoomablePosition: action.payload.position,
        zoomableScale: action.payload.scale,
      };
  }

  return state;
};

interface IPlotContext {
  state?: PlotState;
  dispatch?: Dispatch<PixiPlotActions>;
}
const DomPlotContext = React.createContext<IPlotContext>({});

const PlotContextProvider: React.SFC = (props) => {
  const [state, dispatch] = React.useReducer(reducer, defaultState);
  const value = { state, dispatch };

  return <DomPlotContext.Provider value={value}>{props.children}</DomPlotContext.Provider>;
};

const PixiPlotContext = React.createContext<IPlotContext>({});

export { DomPlotContext, PlotContextProvider, PixiPlotContext };
