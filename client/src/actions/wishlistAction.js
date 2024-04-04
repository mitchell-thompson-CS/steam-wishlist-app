import { ADD_GAME_TO_WISHLIST, CREATE_WISHLIST, DELETE_GAME_FROM_WISHLIST, DELETE_WISHLIST, DELETE_WISHLISTS, RENAME_WISHLIST, SET_WISHLIST, SET_WISHLISTS } from "../actionTypes/actionTypes";

const createWishlist = (inputId, inputName, inputWishlistType="owned") => {
    return {
        type: CREATE_WISHLIST,
        payload: {
            wishlistID: inputId,
            wishlistName: inputName,
            wishlistType: inputWishlistType,
        }
    };
};

const deleteWishlist = (inputId) => {
    return {
        type: DELETE_WISHLIST,
        payload: {
            wishlistID: inputId,
        }
    };
};

const renameWishlist = (inputId, inputName) => {
    return {
        type: RENAME_WISHLIST,
        payload: {
            wishlistID: inputId,
            wishlistName: inputName,
        }
    };
};

const setWishlists = (inputWishlists) => {
    return {
        type: SET_WISHLISTS,
        payload: {
            wishlists: inputWishlists,
        }
    };
}

const setWishlist = (inputWishlistID, inputWishlistType, inputWishlist) => {
    return {
        type: SET_WISHLIST,
        payload: {
            wishlistID: inputWishlistID,
            wishlistType: inputWishlistType,
            wishlist: inputWishlist,
        }
    };

}

const deleteWishlists = () => {
    return {
        type: DELETE_WISHLISTS,
    };
};

const addGameToWishlist = (inputWishlistID, inputWishlistType, inputGameID, inputGameName) => {
    return {
        type: ADD_GAME_TO_WISHLIST,
        payload: {
            wishlistID: inputWishlistID,
            wishlistType: inputWishlistType,
            gameID: inputGameID,
            gameName: inputGameName,
        }
    };
}

const deleteGameFromWishlist = (inputWishlistID, inputWishlistType, inputGameID) => {
    return {
        type: DELETE_GAME_FROM_WISHLIST,
        payload: {
            wishlistID: inputWishlistID,
            wishlistType: inputWishlistType,
            gameID: inputGameID,
        }
    };
}

export { createWishlist, deleteWishlist, setWishlists, setWishlist, 
    deleteWishlists, renameWishlist, addGameToWishlist, 
    deleteGameFromWishlist};