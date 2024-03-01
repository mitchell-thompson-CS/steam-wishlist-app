import { configureStore, combineReducers } from '@reduxjs/toolkit';
import wishlistReducer from "./reducers/wishlistReducer";
import userReducer from './reducers/userReducer';
import eventReducer from './reducers/eventReducer';

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
        const serializedState = JSON.stringify({
            userReducer: state.userReducer,
            wishlistReducer: state.wishlistReducer,
        });
        sessionStorage.setItem("state", serializedState);
    } catch (e) {
        console.log(e);
    }
}

const store = configureStore({
    reducer: combineReducers({
        wishlistReducer,
        userReducer,
        eventReducer,
    }),
    preloadedState: loadFromSessionStorage(),
});

store.subscribe(() => {
    saveToSessionStorage(store.getState());
});

export default store;