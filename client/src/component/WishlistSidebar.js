import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import '../styles/WishlistSidebar.css';
import { Link } from "react-router-dom";

const WishlistSidebar = () => {

    // HOW TO GET WISHLISTITEMS TO CHANGE WHEN THEY CHANGE FOR WISHLISTS COMPONENT??

    const [wishlistItems, setWishlistItems] = useState([]);

    useEffect(() => {
        fetch('/api/wishlists', { mode: 'cors', credentials: 'include' })
            .then(function (response) {
                if (response.status === 200) {
                    return response.json();
                }
            }).then(function (data) {
                if (data) {
                    setWishlistItems(data);
                }
            })
    }, []);

    return (
        <div className="sidebar">
            <ul>
                <li id="wishlistSearchArea">
                    <form>
                        <input type="text" id="wishlistSearch" name="search" placeholder="Search..."/>
                    </form>
                </li>
                {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                    <li key={key} className="wishlistItem"><Link to={"/wishlists/" + key}>{value.name}</Link></li>
                ))}
                {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                    <li key={key} className="wishlistItem"><Link to={"/wishlists/" + key}>{value.name}</Link></li>
                ))}
            </ul>
        </div>
    );
};

export default WishlistSidebar;