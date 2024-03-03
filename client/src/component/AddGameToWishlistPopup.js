import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import '../styles/AddGameToWishlistPopup.css';
import { setAddGameToWishlist, setLoading } from "../actions/eventAction";
import axios from "axios";
import { deleteWishlists } from "../actions/wishlistAction";

const AddGameToWishlistPopup = (props) => {
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    // const addingGame = useSelector(state => state.eventReducer.addingGame);
    const dispatch = useDispatch();
    const [wishlistsToAddTo, setWishlistToAddTo] = useState({});
    const [wishlistsToRemoveFrom, setWishlistsToRemoveFrom] = useState({});

    // close the popup when clicking outside of it
    const closePopup = useCallback((e) => {
        if (e.target.className === "addGameToWishlistPopup" || e.key === "Escape"
            || e.target.id === "close-wishlist-add-popup") {
            dispatch(setAddGameToWishlist(null));
            document.removeEventListener('click', closePopup);
            document.removeEventListener('keydown', closePopup);
        }
    }, [dispatch])

    useEffect(() => {
        // need to reset the wishlistsToAddTo and wishlistsToRemoveFrom when the popup is closed
        if (!props.trigger) {
            setWishlistToAddTo({});
            setWishlistsToRemoveFrom({});
        }
    }, [props.trigger]);

    useEffect(() => {
        // disable scrolling when popup is open
        if (props.trigger) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [props.trigger]);

    useEffect(() => {
        // add event listeners to close the popup when active
        if (props.trigger) {
            document.addEventListener('click', closePopup);
            document.addEventListener('keydown', closePopup);
        }
    }, [dispatch, props.trigger, closePopup]);

    useEffect(() => {
        // need to trigger the hover effect to all wishlists with the game already
        let wishlistGameStatus = document.getElementsByClassName("wishlist-popup-wishlist-status");
        for (let i = 0; i < wishlistGameStatus.length; i++) {
            if (wishlistGameStatus[i].innerText === "-") {
                wishlistGameStatus[i].parentNode.style.backgroundColor = "#444";
            } else {
                wishlistGameStatus[i].parentNode.style.backgroundColor = "";
            }
        }
    });

    async function saveWishlistChanges() {
        dispatch(setLoading(true));
        try {
            // need to send the changes to the server
            let add = Object.keys(wishlistsToAddTo);
            let remove = Object.keys(wishlistsToRemoveFrom);
            if (add.length > 0 || remove.length > 0) {
                let gameId = props.trigger;
                let res = await axios.post('/api/game/add', { game_id: gameId, wishlists: add });
                console.log(res);

                dispatch(deleteWishlists())
            }
        } catch (err) {
            console.log(err);
        }
        dispatch(setLoading(false));
    }

    function selectWishlist(e) {
        try {
            const wishlistId = e.currentTarget.id;
            const wishlistName = e.currentTarget.childNodes[0].innerText;
            const wishlistStatus = e.currentTarget.childNodes[1].innerText;
            if (wishlistStatus === "+") {
                // need to make sure that it isn't in the queue to be deleted
                if (wishlistsToRemoveFrom !== undefined && wishlistsToRemoveFrom[wishlistId] !== undefined) {
                    let temp = { ...wishlistsToRemoveFrom };
                    delete temp[wishlistId];
                    setWishlistsToRemoveFrom(temp);
                } else {
                    setWishlistToAddTo({ ...wishlistsToAddTo, [wishlistId]: wishlistName });
                }
                e.currentTarget.childNodes[1].innerText = "-";
            } else {
                // need to make sure that it isn't in the queue to be added
                if (wishlistsToAddTo !== undefined && wishlistsToAddTo[wishlistId] !== undefined) {
                    let temp = { ...wishlistsToAddTo };
                    delete temp[wishlistId];
                    setWishlistToAddTo(temp);
                } else {
                    setWishlistsToRemoveFrom({ ...wishlistsToRemoveFrom, [wishlistId]: wishlistName });
                }
                e.currentTarget.childNodes[1].innerText = "+";
            }
        } catch (err) {
            console.log(err);
        }
    }

    return (
        props.trigger ?
            <div className="addGameToWishlistPopup">
                <div className="addGameToWishlistPopupInner">
                    <h1>Add Game To Wishlist</h1>
                    <div className="addGameToWishlistPopupInnerContent">
                        <div className="addGameToWishlistEntries">
                            <h2>Owned</h2>
                            {wishlistItems.owned !== undefined ?
                                Object.keys(wishlistItems.owned).map((key) => {
                                    return (
                                        <div key={key} className="wishlistGamePopupWishlistName" id={key} onClick={selectWishlist}>
                                            <h3 className="wishlist-popup-name">{wishlistItems.owned[key].name}</h3>
                                            <h3 className="wishlist-popup-wishlist-status">
                                                {wishlistItems.owned[key].games[props.trigger] !== undefined ? "-" : "+"}
                                            </h3>
                                            <div className="clear"></div>
                                        </div>
                                    )
                                })
                                : null}
                        </div>

                        <div className="addGameToWishlistEntries">
                            <h2>Shared</h2>
                            {wishlistItems.shared !== undefined ?
                                Object.keys(wishlistItems.shared).map((key) => {
                                    return (
                                        <div key={key} className="wishlistGamePopupWishlistName" id={key} onClick={selectWishlist}>
                                            <h3 className="wishlist-popup-name">{wishlistItems.shared[key].name}</h3>
                                            <h3 className="wishlist-popup-wishlist-status">
                                                {wishlistItems.shared[key].games[props.trigger] !== undefined ? "-" : "+"}
                                            </h3>
                                            <div className="clear"></div>
                                        </div>
                                    )
                                })
                                : null}
                        </div> {/* end of shared */}
                    </div> {/* end of inner content */}
                    <div className="addGameToWishlistPopupInnerButtons">
                        <button id="close-wishlist-add-popup">Cancel</button>
                        <button onClick={saveWishlistChanges}>Save</button>
                    </div>
                </div> {/* end of inner */}
            </div> // end of popup
            : null
    )
}

export default AddGameToWishlistPopup;