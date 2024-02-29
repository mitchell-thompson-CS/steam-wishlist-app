import { RESET_EVENT, SET_EVENT, SET_LOADING, RESET_LOADING } from "../actionTypes/actionTypes";


const initialState = {
    event: false,
    eventbody: {},
    eventPositive: false,
    loading: false,
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
                loading: true,
            };
        case RESET_LOADING:
            return {
                ...state,
                loading: false,
            };
        default:
            return state;
    }
};

export default eventReducer;