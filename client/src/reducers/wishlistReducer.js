import { CREATE_WISHLIST, DELETE_WISHLIST } from "../actionTypes/actionTypes";

const initialState = {
    wishlists: {},
};

const wishlistReducer = (state = initialState, action) => {
    // action : { type: "CREATE_WISHLIST", payload: { id : id, name : name, ...} }
    switch (action.type) {
        case CREATE_WISHLIST:
            return {
                ...state,
                wishlists: {
                    ...state.wishlists,
                    [action.payload.wishlistID]: { name: action.payload.wishlistName },
                },
            };
        case DELETE_WISHLIST:
            let newState = Object.keys(state.wishlists).reduce((object, key) => {
                if (key !== action.payload.wishlistID) {
                    object[key] = state.wishlists[key];
                }
                return object;
            }, {});
            return {
                ...state,
                wishlists: newState,
            };
        default:
            return state;
    }
};

export default wishlistReducer;