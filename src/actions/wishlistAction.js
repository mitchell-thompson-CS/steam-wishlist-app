import { CREATE_WISHLIST, DELETE_WISHLIST } from "../actionTypes/actionTypes";

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

export { createWishlist, deleteWishlist };