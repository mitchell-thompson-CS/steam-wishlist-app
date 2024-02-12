import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist } from "../actions/wishlistAction";
import axios from "axios";

async function createWishlistPost() {
    try {
        let res = await axios.post('/api/wishlist/create', {
            wishlist_name: "test wishlist 1"
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }
}

async function addGameToWishlist() {
    try {
        let res = await axios.post('/api/game/add', {
            wishlist_id: "fcdcb6ad-6ec6-4763-b547-dffce78f00a6",
            game_id: "10560053820595849305"
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }
}

async function deleteWishlistPost() {
    try {
        let res = await axios.delete('/api/wishlist/delete', {
            data: {
                wishlist_id: "d957cdc7-7e84-46a5-bedd-e8c5ec404756"
            }
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }

}

const Wishlist = () => {
    const state = useSelector((state) => state);
    console.log(state);
    const dispatch = useDispatch();
    return (
        <div className="wishlist">
            <h2>Wishlists: </h2>
            {/* <button className="green" onClick={() => {dispatch(createWishlist("123456789secret", "test wishlist"))}}>Create Wishlist</button>
            <button className="red" onClick={() => {dispatch(deleteWishlist("123456789secret"))}}>Delete Wishlist</button> */}
            <button onClick={createWishlistPost}>Create Wishlist Post</button>
            <button onClick={addGameToWishlist}>Add Game to Wishlist</button>
            <button onClick={deleteWishlistPost}>Delete Wishlist Post</button>
        </div>
    );
};

export default Wishlist;