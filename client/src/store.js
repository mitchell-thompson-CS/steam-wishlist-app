import { configureStore, combineReducers } from '@reduxjs/toolkit';
import wishlistReducer from "./reducers/wishlistReducer";
import userReducer from './reducers/userReducer';
import eventReducer from './reducers/eventReducer';
import gameReducer from './reducers/gameReducer';

function loadFromSessionStorage() {
    try {
        const serializedState = sessionStorage.getItem("state");
        let state = JSON.parse(serializedState);
        // const serializedState2 = localStorage.getItem("state");
        // let state2 = JSON.parse(serializedState2);
        return {
            ...state,
            // ...state2,
        };
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

        // const serializedState2 = JSON.stringify({
        //     gameReducer: state.gameReducer,
        // });
        // localStorage.setItem("state", serializedState2);
    } catch (e) {
        console.log(e);
    }
}

const store = configureStore({
    reducer: combineReducers({
        wishlistReducer,
        userReducer,
        eventReducer,
        gameReducer,
    }),
    preloadedState: loadFromSessionStorage(),
});

store.subscribe(() => {
    saveToSessionStorage(store.getState());
});

export default store;