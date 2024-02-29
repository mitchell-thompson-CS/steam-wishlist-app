import { CREATE_WISHLIST, DELETE_WISHLIST, DELETE_WISHLISTS, RENAME_WISHLIST, SET_WISHLISTS } from "../actionTypes/actionTypes";

const createWishlist = (inputId, inputName) => {
    return {
        type: CREATE_WISHLIST,
        payload: {
            wishlistID: inputId,
            wishlistName: inputName,
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

const deleteWishlists = () => {
    return {
        type: DELETE_WISHLISTS,
    };
};

export { createWishlist, deleteWishlist, setWishlists, deleteWishlists, renameWishlist};