import { SET_USER, DELETE_USER } from "../actionTypes/actionTypes";

const initialState = {
    user: {},
};

const userReducer = (state = initialState, action) => {
    // action : { type: "CREATE_WISHLIST", payload: { id : id, name : name, ...} }
    switch (action.type) {
        case SET_USER:
            return {
                ...state,
                user: action.payload,
            };

        case DELETE_USER:
            return {
                ...state,
                user: {},
            };
        default:
            return state;
    }
};

export default userReducer;