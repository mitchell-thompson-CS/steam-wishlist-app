import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import '../styles/WishlistSidebar.css';
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const WishlistSidebar = () => {

    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);

    return (
        <div className="sidebar">
            <ul>
                <li id="wishlistSearchArea">
                    <form>
                        <input type="text" id="wishlistSearch" name="search" placeholder="Search..." />
                    </form>
                </li>
                {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                    <li key={key} className="wishlistItem" title={value.name}>
                            <Link to={"/wishlists/" + key}>
                                {value.name}
                            </Link>
                    </li>
                ))}
                {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                    <li key={key} className="wishlistItem" title={value.name}>
                        <Link to={"/wishlists/" + key}>{value.name}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default WishlistSidebar;