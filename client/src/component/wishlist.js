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
            wishlist_id: "58152a82-e9a5-4bf2-b89d-f073ca7b6891",
            game_id: "105600"
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
                wishlist_id: "58152a82-e9a5-4bf2-b89d-f073ca7b6891"
            }
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }

}

async function removeGameFromWishlist() {
    try {
        let res = await axios.delete('/api/game/remove', {
            data: {
                wishlist_id: "58152a82-e9a5-4bf2-b89d-f073ca7b6891",
                game_id: "105600"
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
            <button onClick={removeGameFromWishlist}>Remove Game from Wishlist</button>
        </div>
    );
};

export default Wishlist;