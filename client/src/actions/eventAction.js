import { SET_EVENT, RESET_EVENT, SET_LOADING, SET_ADD_GAME_TO_WISHLIST, SET_SEARCH_POPUP } from "../actionTypes/actionTypes";

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

const setLoading = (newLoading = true) => {
    return {
        type: SET_LOADING,
        payload: {
            loading: newLoading,
        }
    };
}

const setAddGameToWishlist = (input) => {
    return {
        type: SET_ADD_GAME_TO_WISHLIST,
        payload: {
            addingGame: input,
        }
    };
}

const setSearchPopup = (inputState, inputAdding=null) => {
    return {
        type: SET_SEARCH_POPUP,
        payload: {
            searchPopup: inputState,
            addingGame: inputAdding,
        }
    };
}

export { setEvent, resetEvent, setLoading, setAddGameToWishlist, setSearchPopup };