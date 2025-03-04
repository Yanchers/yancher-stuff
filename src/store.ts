import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { wsMiddleware } from './middleware';
import wsSliceReducer from './wsSlice';

const rootReducer = combineReducers({
    ws: wsSliceReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (gdm) => gdm({ serializableCheck: false }).concat(wsMiddleware),
});

export type RootState = ReturnType<typeof rootReducer>;

export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
