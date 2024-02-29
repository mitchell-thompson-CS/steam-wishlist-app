import { configureStore, combineReducers } from '@reduxjs/toolkit';
import wishlistReducer from "./reducers/wishlistReducer";
import userReducer from './reducers/userReducer';

const store = configureStore({ reducer: combineReducers({
    wishlistReducer,
    userReducer,
})});

export default store;