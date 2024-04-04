import { ADD_GAME, REMOVE_GAME, RESET_GAMES } from "../actionTypes/actionTypes";

const initialState = {
    games: {},
};

const gameReducer = (state = initialState, action) => {
    switch (action.type) {
        case ADD_GAME:
            return {
                ...state,
                games: {
                    ...state.games,
                    [action.payload.gameId]: action.payload.gameData
                }
            };
        case REMOVE_GAME:
            let newState = {
                ...state,
                games: {
                    ...state.games
                }
            }
            delete newState.games[action.payload.gameId];
            return newState;
        case RESET_GAMES:
            return {
                ...state,
                games: {}
            };
        default:
            return state;
    }
};

export default gameReducer;