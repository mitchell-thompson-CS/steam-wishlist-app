import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist } from "../actions/wishlistAction";

const Wishlist = () => {
    const state = useSelector((state) => state);
    console.log(state);
    const dispatch = useDispatch();
    return (
        <div className="wishlist">
            <h2>Wishlists: </h2>
            <button className="green" onClick={() => {dispatch(createWishlist("123456789secret", "test wishlist"))}}>Create Wishlist</button>
            <button className="red" onClick={() => {dispatch(deleteWishlist("123456789secret"))}}>Delete Wishlist</button>
        </div>
    );
};

export default Wishlist;