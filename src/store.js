import { configureStore } from '@reduxjs/toolkit';
import wishlistReducer from "./reducers/wishlistReducer";

const store = configureStore({ reducer: wishlistReducer });

export default store;