import { configureStore, combineReducers } from '@reduxjs/toolkit';
import wishlistReducer from "./reducers/wishlistReducer";
import userReducer from './reducers/userReducer';

function loadFromSessionStorage() {
    try {
        const serializedState = sessionStorage.getItem("state");
        if (serializedState === null) return undefined;
        return JSON.parse(serializedState);
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

function saveToSessionStorage(state) {
    try {
        const serializedState = JSON.stringify(state);
        sessionStorage.setItem("state", serializedState);
    } catch (e) {
        console.log(e);
    }
}

const store = configureStore({
    reducer: combineReducers({
        wishlistReducer,
        userReducer,
    }),
    preloadedState: loadFromSessionStorage(),
});

store.subscribe(() => {
    saveToSessionStorage(store.getState());
});

export default store;