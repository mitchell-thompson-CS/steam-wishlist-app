import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist } from "../actions/wishlistAction";
import axios from "axios";
import Popup from './Popup';
import '../Wishlist.css';


const WishlistInner = () => {

    return (
        <div>
            <h1>Wishlist Page</h1>
        </div>
    )
}
export default WishlistInner;