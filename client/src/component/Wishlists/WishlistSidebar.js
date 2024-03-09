import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import '../../styles/WishlistSidebar.css';
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import collapseLeft from "../../resources/collapse-left.svg";
import collapseRight from "../../resources/collapse-right.svg";

const WishlistSidebar = () => {

    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);

    function toggleHideSidebar(e) {
        let sidebar = document.getElementsByClassName("sidebar");
        for (let element of sidebar) {
            let style = window.getComputedStyle(element);
            if (style.width > "0px") {
                element.style.width = "0";
                element.style.minWidth = "0";
            } else {
                element.style.width = "20%";
                element.style.minWidth = "175px";
            }
        }
    }

    return (
        <div className="sidebar">
            <div id="sidebar-right">
                <div id="sidebar-right-content" onClick={() => {toggleHideSidebar();}}>
                    <div>|||</div>
                    {/* <img src={collapseLeft} alt="left" id="collapse-side-image"/> */}
                </div>
            </div>
            <div id="sidebar-content">
                <ul>
                    <li id="wishlistSearchArea">
                        <form>
                            <input type="text" id="wishlistSearch" name="search" placeholder="Search..." />
                        </form>
                    </li>
                    <li id="wishlistsidebarhome">
                        <Link to="/wishlists">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="100px" height="100px">    <path d="M 25 1.0507812 C 24.7825 1.0507812 24.565859 1.1197656 24.380859 1.2597656 L 1.3808594 19.210938 C 0.95085938 19.550938 0.8709375 20.179141 1.2109375 20.619141 C 1.5509375 21.049141 2.1791406 21.129062 2.6191406 20.789062 L 4 19.710938 L 4 46 C 4 46.55 4.45 47 5 47 L 19 47 L 19 29 L 31 29 L 31 47 L 45 47 C 45.55 47 46 46.55 46 46 L 46 19.710938 L 47.380859 20.789062 C 47.570859 20.929063 47.78 21 48 21 C 48.3 21 48.589063 20.869141 48.789062 20.619141 C 49.129063 20.179141 49.049141 19.550938 48.619141 19.210938 L 25.619141 1.2597656 C 25.434141 1.1197656 25.2175 1.0507812 25 1.0507812 z M 35 5 L 35 6.0507812 L 41 10.730469 L 41 5 L 35 5 z" /></svg>
                            <span>Home</span>
                            <div className="clear"></div>
                        </Link>
                    </li>
                </ul>
                <ul id="sidebar-wishlists">
                    {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                        value ?
                            <li key={key} className="wishlistItem" title={value.name}>
                                <Link to={"/wishlists/" + key}>
                                    {value.name}
                                </Link>
                            </li>
                            : null
                    ))}
                    {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                        value ?
                            <li key={key} className="wishlistItem" title={value.name}>
                                <Link to={"/wishlists/" + key}>{value.name}</Link>
                            </li>
                            : null
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default WishlistSidebar;