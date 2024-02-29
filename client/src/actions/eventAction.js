import { SET_EVENT, RESET_EVENT, SET_LOADING, RESET_LOADING } from "../actionTypes/actionTypes";

const setEvent = (postive, inputEvent) => {
    return {
        type: SET_EVENT,
        payload: {
            postiveEvent: postive,
            event: inputEvent,
        }
    };
}

const resetEvent = () => {
    return {
        type: RESET_EVENT,
    };
}

const setLoading = () => {
    return {
        type: SET_LOADING,
    };
}

const resetLoading = () => {
    return {
        type: RESET_LOADING,
    };
}

export { setEvent, resetEvent, setLoading, resetLoading };