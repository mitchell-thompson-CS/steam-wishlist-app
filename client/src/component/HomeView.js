import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist, renameWishlist, setWishlists } from "../actions/wishlistAction";
import axios from "axios";
import Popup from './Popup';
import '../styles/HomeView.css';
import { Link } from "react-router-dom";
import { setEvent, setLoading } from "../actions/eventAction";
import WishlistGridHeader from "./WishlistGridHeader";

const HomeView = () => {
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [inputText, setInputText] = useState("");
    const [contextPopup, setContextPopup] = useState("");
    const dispatch = useDispatch();

    return (
        <div className="homeView">
            <div className="gridContainer">
                {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                    <div key={key} className="gridItemContainer" title={value.name} >
                        <Link className="gridItem" to={"/wishlists/" + key}>
                            <h2>{value.name}</h2>

                        </Link>
                    </div>
                ))}
                {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                    <div key={key} className="gridItemContainer" title={value.name}>
                        <Link className="gridItem" to={"/wishlists/" + key}>{value.name}</Link>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default HomeView;