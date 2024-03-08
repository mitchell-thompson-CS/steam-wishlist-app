import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import '../../styles/AddGameToWishlistPopup.css';
import { setAddGameToWishlist, setEvent, setLoading } from "../../actions/eventAction";
import axios from "axios";
import { addGameToWishlist, deleteGameFromWishlist, deleteWishlists } from "../../actions/wishlistAction";

const AddGameToWishlistPopup = (props) => {
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const gameData = useSelector(state => state.gameReducer.games);
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
        let success = true;
        try {
            // need to send the changes to the server
            let add = Object.keys(wishlistsToAddTo);
            let remove = Object.keys(wishlistsToRemoveFrom);
            let gameId = props.trigger;
            if (add.length > 0) {
                let res_add = await axios.post('/api/game/add', { game_id: gameId, wishlists: add });
                if (res_add.status !== 200) {
                    success = false;
                }
            }

            if (remove.length > 0) {
                let res_del = await axios.delete('/api/game/remove', { data: { game_id: gameId, wishlists: remove } });
                if (res_del.status !== 200) {
                    success = false;
                }
            }
            if (!success) {
                throw new Error("Error saving changes");
            } else {
                // successful, so need to update the redux store
                for (let a in add) {
                    if (gameData[gameId] !== undefined) {
                        dispatch(addGameToWishlist(add[a],
                            wishlistItems.owned[add[a]] !== undefined ? "owned" : "shared",
                            gameId,
                            gameData[gameId].name));
                    } else {
                        throw new Error("Game not found");
                    }
                }
                for (let r in remove) {
                    dispatch(deleteGameFromWishlist(remove[r],
                        wishlistItems.owned[remove[r]] !== undefined ? "owned" : "shared",
                        gameId));
                }
            }
        } catch (err) {
            console.log(err);
            dispatch(setEvent(false, "Error saving changes"));
            // if there was an error, need to reset the wishlists to see what changed
            dispatch(deleteWishlists());
            success = false;
        }

        // after the operations, clear the lists (even if there was an error)
        setWishlistToAddTo({});
        setWishlistsToRemoveFrom({});

        dispatch(setLoading(false));

        if (success) {
            dispatch(setEvent(true, "Changes saved"));
        }

        // close the popup
        dispatch(setAddGameToWishlist(null));
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
                    <h1>Select Wishlists</h1>
                    <div className="addGameToWishlistPopupInnerContent">
                        <div className="addGameToWishlistEntries">
                            <h2>Your Wishlists</h2>
                            {wishlistItems.owned !== undefined ?
                                Object.keys(wishlistItems.owned).map((key) => {
                                    return (
                                        <div key={key} className="wishlistGamePopupWishlistName" id={key} onClick={selectWishlist}>
                                            <h3 className="wishlist-popup-name" title={wishlistItems.owned[key].name}>{wishlistItems.owned[key].name}</h3>
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
                            <h2>Shared Wishlists</h2>
                            {wishlistItems.shared !== undefined ?
                                Object.keys(wishlistItems.shared).map((key) => {
                                    return (
                                        <div key={key} className="wishlistGamePopupWishlistName" id={key} onClick={selectWishlist}>
                                            <h3 className="wishlist-popup-name" title={wishlistItems.shared[key].name}>{wishlistItems.shared[key].name}</h3>
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
                        <button id="save-wishlist-add-popup" onClick={saveWishlistChanges}>Save</button>
                    </div>
                </div> {/* end of inner */}
            </div> // end of popup
            : null
    )
}

export default AddGameToWishlistPopup;