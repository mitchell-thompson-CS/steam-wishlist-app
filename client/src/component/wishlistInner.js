import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist } from "../actions/wishlistAction";
import axios from "axios";
import Popup from './Popup';
import '../WishlistInner.css';
import { useParams } from "react-router-dom";
import WishlistSidebar from "./WishlistSidebar";


async function addGameToWishlist(wishlist, game="105600") {
    try {
        let res = await axios.post('/api/game/add', {
            wishlist_id: wishlist,
            game_id: game
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }
}

const WishlistInner = () => {
    const [wishlistItem, setWishlistItem] = useState([]);
    let { id } = useParams();

    useEffect(() => {
        fetch('/api/wishlist/' + id, { mode: 'cors', credentials: 'include' })
            .then(function (response) {
                if (response.status === 200) {
                    return response.json();
                }
            }).then(function (data) {
                if (data) {
                    setWishlistItem(data);
                    console.log(data);
                }
            })
    }, [useParams()]);

    return (
        <div className="wishlistInner">
            {/* <div className="listContainer"> */}
                <ul className="gameList">
                    {wishlistItem.games && Object.entries(wishlistItem.games).map(([key, value]) => (
                        <li key={key} className="gameItem">
                            <div className="gameContainer">
                                <a href={"/game/" + key} className="gameLink">{value}</a>
                                <p className="priceTitle">Price</p>
                                <p className="lowestPriceTitle">Lowest Price</p>
                                <p className="playingNowTitle">Playing Now</p>
                                <p className="reviewPercentTitle">Positive Review %</p>
                            </div>
                        </li>
                    ))}
                </ul>
            {/* </div> */}
            <button onClick={() => addGameToWishlist(id)}>Add Game to Wishlist</button>
        </div>
    )
}
export default WishlistInner;