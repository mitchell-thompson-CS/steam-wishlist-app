import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist } from "../actions/wishlistAction";
import axios from "axios";
import Popup from './Popup';
import '../Wishlist.css';

async function createWishlistPost(wishlistName) {
    try {
        let res = await axios.post('/api/wishlist/create', {
            wishlist_name: wishlistName
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

async function deleteWishlistPost(id) {
    try {
        let res = await axios.delete('/api/wishlist/delete', {
            data: {
                wishlist_id: id
            }
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }

}

async function renameWishlistPost(id, name) {
    try {
        let res = await axios.post('/api/wishlist/rename', {
            wishlist_id: id,
            wishlist_name: name
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

async function addEditorToWishlist() {
    try {
        let res = await axios.post('/api/wishlist/add-editor', {
            wishlist_id: "1a048b1c-3112-4fd0-9465-adfa1b5ae0b7",
            editor_id: "76561198012386061"
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }

}

async function deleteEditorFromWishlist() {
    try {
        let res = await axios.delete('/api/wishlist/delete-editor', {
            data: {
                wishlist_id: "1a048b1c-3112-4fd0-9465-adfa1b5ae0b7",
                editor_id: "76561198012386061"
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
    // console.log(state);
    const dispatch = useDispatch();

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

    const [buttonPopup, setButtonPopup] = useState(false);
    const [inputText, setInputText] = useState("");
    const [contextPopup, setContextPopup] = useState("");

    return (
        <div className="wishlist">
            <div className="sidebar">
                <ul>
                    <li id="wishlistSearchArea">
                        <form>
                            <input type="text" id="wishlistSearch" name="search" placeholder="Search..."/>
                        </form>
                    </li>
                    {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                        <li key={key} className="wishlistItem">{value.name}</li>
                    ))}
                    {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                        <li key={key} className="wishlistItem">{value.name}</li>
                    ))}
                </ul>
            </div>
            {/* <button className="green" onClick={() => {dispatch(createWishlist("123456789secret", "test wishlist"))}}>Create Wishlist</button>
            <button className="red" onClick={() => {dispatch(deleteWishlist("123456789secret"))}}>Delete Wishlist</button> */}
            <div className="gridContainer">
                <button onClick={() => setButtonPopup(true)} className="gridItem" id="createWishlistButton">+</button>
                {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                    <div className="gridItemContainer">
                        <a key={key} className="gridItem" href={"/wishlist/" + key}>{value.name}</a>
                        <div className="contextMenu" onClick={() => {setContextPopup(key)}}>...</div>
                    </div>
                ))}
                {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                    <div className="gridItemContainer">
                        <a key={key} className="gridItem" href={"/wishlist/" + key}>{value.name}</a>
                        <div className="sharedTag">(shared)</div>
                    </div>
                ))}
            </div>
            <button onClick={createWishlistPost}>Create Wishlist Post</button>
            <button onClick={addGameToWishlist}>Add Game to Wishlist</button>
            <button onClick={deleteWishlistPost}>Delete Wishlist Post</button>
            <button onClick={removeGameFromWishlist}>Remove Game from Wishlist</button>
            <button onClick={addEditorToWishlist}>Add Editor to Wishlist</button>
            <button onClick={deleteEditorFromWishlist}>Delete Editor from Wishlist</button>
            <button onClick={() => setButtonPopup(true)}>Open Popup</button>
            <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
                <input type="text" placeholder="Enter Wishlist Name..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="popupInput"/>
                <button onClick={() => {setButtonPopup(false); createWishlistPost(inputText)}} className="popupButton">Create Wishlist Post</button>
            </Popup>
            <Popup trigger={contextPopup} setTrigger={setContextPopup}>
                <button onClick={() => {setContextPopup(""); deleteWishlistPost(contextPopup)}} className="popupButton">Delete Wishlist Post</button>
                <br></br>
                <input type="text" placeholder="Enter New Wishlist Name..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="popupInput"/>
                <button onClick={() => {setContextPopup(""); renameWishlistPost(contextPopup, inputText)}} className="popupButton">Rename Wishlist Post</button>
            </Popup>
        </div>
    );
};

export default Wishlist;