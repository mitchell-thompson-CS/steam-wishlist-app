import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist, renameWishlist, setWishlists } from "../../actions/wishlistAction";
import axios from "axios";
import Popup from '../Popups/Popup';
import '../../styles/Wishlists.css';
import { Link } from "react-router-dom";
import { setEvent, setLoading } from "../../actions/eventAction";
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
                <button onClick={() => {setButtonPopup(true); setInputText("");}} className="gridItemContainer" id="createWishlistButton">+</button>
                {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                    <div key={key} className="gridItemContainer" title={value.name} >
                        <Link className="gridItem" to={"/wishlists/" + key}>
                            <h2>{value.name}</h2>
                            <p>
                                {value.games ? Object.keys(value.games).length : 0}
                                {value.games && Object.keys(value.games).length === 1 ? " Game" : " Games"}
                            </p>
                        </Link>
                        <div className="contextMenu" onClick={() => {setContextPopup(key); setInputText(value.name);}}>...</div>
                    </div>
                ))}
                {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                    <div key={key} className="gridItemContainer" title={value.name}>
                        <Link className="gridItem" to={"/wishlists/" + key}>
                            <h2>{value.name}</h2>
                            <p>
                                {value.games ? Object.keys(value.games).length : 0}
                                {value.games && Object.keys(value.games).length === 1 ? " Game" : " Games"}
                            </p>
                        </Link>
                        <div className="sharedTag">(shared)</div>
                    </div>
                ))}
            </div>
            <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
                <h2>Create Wishlist</h2>
                <div className="popup-section">
                    <input type="text" placeholder="Enter Wishlist Name..." value={inputText} onChange={(e) => setInputText(e.target.value)}/>
                </div>
                <div className="popup-section" style={{marginBottom: 0}}>
                    {/* .THEN STATE CHANGE SUCKS. FIND ANOTHER WAY TO GET COMPONENT TO RERENDER */}
                    <button onClick={() => {createWishlistPost(inputText).then(() => {setButtonPopup(false)})}}>
                        Create
                    </button>
                </div>
            </Popup>
            <Popup trigger={contextPopup} setTrigger={setContextPopup}>
                <div className="popup-section">
                    <input type="text" placeholder="Enter New Wishlist Name..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="popupInput"/>
                    <button onClick={() => {renameWishlistPost(contextPopup, inputText); setContextPopup("")}} className="popupButton">Rename</button>
                </div>
                <div className="popup-section" style={{marginBottom: 0}}>
                    <button onClick={() => {deleteWishlistPost(contextPopup); setContextPopup("")}} className="popupButton">Delete Wishlist</button>
                </div>
            </Popup>
        </div>
    );
};

export default Wishlists;