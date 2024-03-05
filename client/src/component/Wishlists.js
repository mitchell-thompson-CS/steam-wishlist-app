import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist, renameWishlist, setWishlists } from "../actions/wishlistAction";
import axios from "axios";
import Popup from './Popup';
import '../styles/Wishlists.css';
import { Link } from "react-router-dom";
import { setEvent, setLoading } from "../actions/eventAction";
import WishlistGridHeader from "./WishlistGridHeader";

const Wishlists = () => {
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [inputText, setInputText] = useState("");
    const [contextPopup, setContextPopup] = useState("");
    const dispatch = useDispatch();

    function handleResponse(response) {
        try {
            if(response.status === 200){
                dispatch(setEvent(true, "Operation Successful"));
                return true;
            } else {
                // if response is not 200 we are going to make an error appear for the user
                dispatch(setEvent(false, "Error " + response.status + ": " + response.statusText));
            }
        } catch (error) {
            // don't need to handle response here, just means that response put in is null
        }

        return false;
    }

    async function createWishlistPost(wishlistName) {
        try {
            dispatch(setLoading(true));
            let res = await axios.post('/api/wishlist/create', {
                wishlist_name: wishlistName
            });
            if (handleResponse(res)) {
                dispatch(createWishlist(res.data.id, wishlistName));
            }
        } catch (error) {
            handleResponse(error.response)
            console.error(error);
        }
        dispatch(setLoading(false))
    }

    async function deleteWishlistPost(id) {
        try {
            dispatch(setLoading(true));
            let res = await axios.delete('/api/wishlist/delete', {
                data: {
                    wishlist_id: id
                }
            });
            console.log(res);
            if (handleResponse(res)) {
                dispatch(deleteWishlist(id));
            }
        } catch (error) {
            handleResponse(error.response)
            console.error(error);
        }
        dispatch(setLoading(false));
    
    }
    
    async function renameWishlistPost(id, name) {
        try {
            dispatch(setLoading(true));
            let res = await axios.post('/api/wishlist/rename', {
                wishlist_id: id,
                wishlist_name: name
            });
            // only on success we want to change the wishlist
            if(handleResponse(res)){
                dispatch(renameWishlist(id, name));
            }
        } catch (error) {
            handleResponse(error.response)
            console.error(error);
        }
        dispatch(setLoading(false));
    }

    return (
        <div className="wishlist">
            <WishlistGridHeader />
            <div className="gridContainer">
                <button onClick={() => {setButtonPopup(true); setInputText("");}} className="gridItem" id="createWishlistButton">+</button>
                {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                    <div key={key} className="gridItemContainer">
                        <Link className="gridItem" to={"/wishlists/" + key}>{value.name}</Link>
                        <div className="contextMenu" onClick={() => {setContextPopup(key); setInputText(value.name);}}>...</div>
                    </div>
                ))}
                {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                    <div key={key} className="gridItemContainer">
                        <Link className="gridItem" to={"/wishlists/" + key}>{value.name}</Link>
                        <div className="sharedTag">(shared)</div>
                    </div>
                ))}
            </div>
            <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
                <div className="popupInputContainer">
                    <input type="text" placeholder="Enter Wishlist Name..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="popupInput"/>
                    {/* .THEN STATE CHANGE SUCKS. FIND ANOTHER WAY TO GET COMPONENT TO RERENDER */}
                    <button onClick={() => {createWishlistPost(inputText).then(() => {setButtonPopup(false)})}} className="popupButton">Create Wishlist</button>
                </div>
            </Popup>
            <Popup trigger={contextPopup} setTrigger={setContextPopup}>
                <div className="popupInputContainer">
                    <input type="text" placeholder="Enter New Wishlist Name..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="popupInput"/>
                    <button onClick={() => {renameWishlistPost(contextPopup, inputText); setContextPopup("")}} className="popupButton">Rename</button>
                </div>
                <div className="popupButtonContainer">
                    <button onClick={() => {deleteWishlistPost(contextPopup); setContextPopup("")}} className="popupButton">Delete Wishlist</button>
                </div>
            </Popup>
        </div>
    );
};

export default Wishlists;