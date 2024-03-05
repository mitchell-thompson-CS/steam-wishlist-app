import { RESET_EVENT, SET_ADD_GAME_TO_WISHLIST, SET_EVENT, SET_LOADING, SET_SEARCH_POPUP } from "../actionTypes/actionTypes";


const initialState = {
    event: false,
    eventbody: {},
    eventPositive: false,
    loading: false,
    addingGame: null,
};

const eventReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_EVENT:
            return {
                ...state,
                event: true,
                eventbody: action.payload.event,
                eventPositive: action.payload.postiveEvent,
            };
        case RESET_EVENT:
            return {
                ...state,
                event: false,
                eventbody: {},
            };
        case SET_LOADING:
            return {
                ...state,
                loading: action.payload.loading,
            };
        case SET_ADD_GAME_TO_WISHLIST:
            return {
                ...state,
                addingGame: action.payload.addingGame,
            };
        case SET_SEARCH_POPUP:
            if(action.payload.searchPopup === false) {
                return {
                    ...state,
                    searchPopup: null,
                };
            }
            
            return {
                ...state,
                searchPopup: {
                    popupState: action.payload.searchPopup,
                    addingGame: action.payload.addingGame,
                }
            };
        default:
            return state;
    }
};

export default eventReducer;