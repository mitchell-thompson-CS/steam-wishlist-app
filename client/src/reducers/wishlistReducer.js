import { CREATE_WISHLIST, DELETE_WISHLIST, DELETE_WISHLISTS, RENAME_WISHLIST, SET_WISHLISTS } from "../actionTypes/actionTypes";

const initialState = {
    wishlists: {},
};

const wishlistReducer = (state = initialState, action) => {
    // action : { type: "CREATE_WISHLIST", payload: { id : id, name : name, ...} }
    let newState = {
        "owned": {
            ...state.wishlists["owned"]
        },
        "shared": {
            ...state.wishlists["shared"],
        }
    };
    switch (action.type) {
        case CREATE_WISHLIST:
            newState[action.payload.wishlistType][action.payload.wishlistID] = {
                name: action.payload.wishlistName,
                games: []
            };

            return {
                ...state,
                wishlists: newState,
            };
        case DELETE_WISHLIST:
            if(state.wishlists["owned"][action.payload.wishlistID]){
                delete newState["owned"][action.payload.wishlistID];
            }

            if(state.wishlists["shared"][action.payload.wishlistID]){
                delete newState["shared"][action.payload.wishlistID];
            }

            return {
                ...state,
                wishlists: newState,
            };
        case SET_WISHLISTS:
            console.log("setting wishlists in reducer")
            return {
                ...state,
                wishlists: action.payload.wishlists,
            };
        case DELETE_WISHLISTS:
            return {
                ...state,
                wishlists: {},
            };
        case RENAME_WISHLIST:

            if(state.wishlists["owned"][action.payload.wishlistID]){
                newState["owned"][action.payload.wishlistID] = {
                    ...state.wishlists["owned"][action.payload.wishlistID],
                    name: action.payload.wishlistName
                }
            }

            if(state.wishlists["shared"][action.payload.wishlistID]){
                newState["shared"][action.payload.wishlistID] = {
                    ...state.wishlists["shared"][action.payload.wishlistID],
                    name: action.payload.wishlistName
                }
            }
            
            return {
                ...state,
                wishlists: {
                    ...newState
                }
            };
        default:
            return state;
    }
};

export default wishlistReducer;