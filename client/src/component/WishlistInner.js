import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteGameFromWishlist, deleteWishlist, setWishlist } from "../actions/wishlistAction";
import axios from "axios";
import '../styles/WishlistInner.css';
import { useParams } from "react-router-dom";
import { setEvent, setLoading, setSearchPopup } from "../actions/eventAction";
import { addGame, removeGame } from "../actions/gameAction";

const WishlistInner = () => {
    const [wishlistItem, setWishlistItem] = useState([]);
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const gameData = useSelector(state => state.gameReducer.games);
    const user = useSelector(state => state.userReducer.user);
    const [gettingGameData, setGettingGameData] = useState(false)
    const gettingWishlistData = useRef(false);
    const [navBarScroll, setNavBarScroll] = useState(false)
    const [removeGameList, setRemoveGameList] = useState({
        list: [],
    });
    let { id } = useParams();
    const dispatch = useDispatch();

    useEffect(() => {
        // fetches the wishlist data for the current wishlist
        async function fetchWishlistData() {
            let data;
            let wishlistFound = (id && wishlistItems !== undefined && wishlistItems.owned !== undefined && wishlistItems.shared !== undefined &&
                (wishlistItems.owned[id] !== undefined || wishlistItems.shared[id] !== undefined));
            if (!wishlistFound && !gettingWishlistData.current) {
                console.log("getting wishlist");
                gettingWishlistData.current = true;
                dispatch(setLoading(true));
                let response = await fetch('/api/wishlist/' + id, { mode: 'cors', credentials: 'include' });
                dispatch(setLoading(false));
                if (response.status !== 200) {
                    return;
                }
                data = await response.json();

                // now need to update redux store with this new wishlist in the correct spot
                if (data !== null && user !== undefined && user.id !== undefined) {
                    if (user.id === data.owner) {
                        dispatch(setWishlist(id, "owned", data));
                    } else if (data.editors[user.id] !== undefined) {
                        dispatch(setWishlist(id, "shared", data));
                    }
                }
            } else if (!gettingWishlistData.current) {
                // update the data with the current wishlist if it already exists
                if (wishlistItems.owned && wishlistItems.owned[id] !== undefined) {
                    data = wishlistItems.owned[id];
                } else if (wishlistItems.shared && wishlistItems.shared[id] !== undefined) {
                    data = wishlistItems.shared[id];
                }
            }
            if (!data) {
                return;
            }
            setWishlistItem(data);
            gettingWishlistData.current = false;
        }
        // if the wishlistItem is not already set, we want to fetch the wishlist data
        fetchWishlistData();
    }, [id, wishlistItems, user, dispatch]);

    useEffect(() => {
        // fetches the game data for each game in the wishlist
        async function fetchGameData(data) {
            if (!gettingGameData && data && data.games && gameData !== undefined) {
                setGettingGameData(true);
                for (const [key, value] of Object.entries(data.games)) {
                    if (gameData[key] === undefined) {
                        try {
                            dispatch(setLoading(true));
                            await fetch('/api/game/' + key, { mode: 'cors', credentials: 'include' })
                                .then(function (response2) {
                                    if (response2.status === 200) {
                                        return response2.json();
                                    }
                                }).then(function (data2) {
                                    if (data2) {
                                        dispatch(addGame(key, data2));
                                    }
                                    dispatch(setLoading(false));
                                })
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
                setGettingGameData(false);
            }
        }
        fetchGameData(wishlistItem);
    }, [wishlistItem, gettingGameData, dispatch, gameData]);

    // enables the search popup with the current wishlists id
    function enableSearchPopup() {
        dispatch(setSearchPopup(true, id));
    }

    // if the user scrolls the page, we want to show the mini header if the user is not at the top of the page
    useEffect(() => {
        let wishlistInner = document.getElementById("wishlistMainContent");
        if (wishlistInner) {
            if (wishlistInner.scrollTop >= 100) {
                setNavBarScroll(true);
            } else {
                setNavBarScroll(false);
            }
            wishlistInner.onscroll = function () {
                if (wishlistInner.scrollTop >= 100) {
                    setNavBarScroll(true);
                } else {
                    setNavBarScroll(false);
                }
            }
        }
    }, []);

    // every time we navigate to a page with a new id we want to deselect anything that was selected
    useEffect(() => {
        deselectSelectedGames();
    }, [id]);

    // add event listener for escape key
    const cancelRemoveGame = useCallback((e) => {
        if (e.key === "Escape") {
            deselectSelectedGames();
        }
    }, []);

    // add event listener for escape key
    useEffect(() => {
        document.onkeydown = cancelRemoveGame;
    }, [cancelRemoveGame]);

    // deselects all the games that are currently selected
    function deselectSelectedGames() {
        setRemoveGameList({
            list: []
        });
        let checkboxes = document.getElementsByClassName("gameSelect");
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
        }
    }

    // attempts to delete all the games in the current list of selected games
    async function deleteSelectedGames() {
        dispatch(setLoading(true));
        let success = true;
        try {
            for (let i = 0; i < removeGameList.list.length; i++) {
                let data = {
                    wishlists: [id],
                    game_id: removeGameList.list[i]
                }
                try {
                    let res = await axios.delete('/api/game/remove', {
                        data: data
                    });
                    if (res.status === 200) {
                        if (wishlistItems.owned && wishlistItems.owned[id] !== undefined) {
                            dispatch(deleteGameFromWishlist(id, "owned", removeGameList.list[i]));
                        } else if (wishlistItems.shared && wishlistItems.shared[id] !== undefined) {
                            dispatch(deleteGameFromWishlist(id, "shared", removeGameList.list[i]));
                        }
                    }
                } catch (error) {
                    console.error(error);
                    success = false;
                }
            }
        } catch (error) {
            console.error(error);
        }


        if (!success) {
            dispatch(setEvent(false, "Error deleting games"));
            // clear the wishlist data and reload it
            // setting the wishlist to undefined will cause the useEffect to fetch the wishlist data again
            // using set instead of delete because we don't want to reorder map if possible
            if (wishlistItems.owned && wishlistItems.owned[id] !== undefined) {
                dispatch(setWishlist(id, "owned", undefined));
            } else if (wishlistItems.shared && wishlistItems.shared[id] !== undefined) {
                dispatch(setWishlist(id, "shared", undefined));
            }
            deselectSelectedGames();
            dispatch(setLoading(false));
        } else {
            dispatch(setEvent(true, "Games deleted successfully"));
            deselectSelectedGames();
            dispatch(setLoading(false));
        }
    }

    return (
        <div className="wishlistInner">
            {/* main header */}
            <div id="wishlistInner-header">
                {wishlistItem && wishlistItem.name
                    ? <h1 id="wishlistInner-title" title={wishlistItem.name}>{wishlistItem.name}</h1>
                    : null
                }
                {wishlistItem && wishlistItem.games ?
                    <h3 id="wishlistInner-count">
                        {Object.keys(wishlistItem.games).length} game{Object.keys(wishlistItem.games).length === 1 ? "" : "s"}
                    </h3>
                    : <h3 id="wishlistInner-count">0 games</h3>
                }
            </div>
            {/* mini header for when below regular header */}
            <div id="wishlistInner-header-mini">
                <div id="wishlistInner-header-main">
                    {removeGameList.list && removeGameList.list.length > 0 ?
                        <>
                            {removeGameList.list && removeGameList.list.length > 0 ?
                                <p>{removeGameList.list.length} selected</p>
                                : null
                            }
                            <h3 className="button-mini-header" id="remove-game-mini" style={{
                                display: removeGameList.list && removeGameList.list.length > 0 ? "inline-block" : "none"
                            }}
                                onClick={deleteSelectedGames}
                            >Delete Game{removeGameList.list && removeGameList.list.length > 1 ? "s" : ""} </h3>

                            <h3 className="button-mini-header" id="cancel-remove-mini" onClick={deselectSelectedGames}>Deselect All</h3>
                        </>
                        :
                        <>
                            <h3 className="button-mini-header" id="add-game-mini" onClick={enableSearchPopup}>Add Game</h3>
                        </>
                    }

                    {wishlistItem && wishlistItem.name && navBarScroll
                        ? <h1 id="wishlistInner-title-mini" title={wishlistItem.name}>{wishlistItem.name}</h1>
                        : null}


                </div>
            </div>
            {/* actual main content of this page, listing the games */}
            <ul className="gameList">
                {wishlistItem.games && Object.entries(wishlistItem.games).map(([key, value]) => (
                    gameData[key] ?
                        <li key={key} className="gameItem" title={gameData[key].name}>
                            {/* selecting the game for deletion */}
                            <div className="gameSelectSection">
                                <input type="checkbox" className="gameSelect" id={"gameSelect" + key}
                                    onChange={(e) => {
                                        if (removeGameList.list.includes(key)) {
                                            let newList = removeGameList.list.filter((item) => item !== key);
                                            setRemoveGameList({
                                                list: newList
                                            });
                                            e.target.checked = false;
                                        } else {
                                            setRemoveGameList({
                                                list: [...removeGameList.list, key]
                                            });
                                            e.target.checked = true;
                                        }
                                    }}
                                />
                                <label htmlFor={"gameSelect" + key}></label>
                            </div>
                            {/* rest of the game information */}
                            <a href={"/game/" + key} className="gameLink">
                                {/* title */}
                                <div className="gameTitle">
                                    <h1 className="gameName">{gameData[key].name}</h1>
                                    <img src={gameData[key].header_image} alt="game thumbnail" />
                                </div>

                                {/* price */}
                                <div className="gamePrice">
                                    <p className="priceTitle">Price</p>
                                    <span className="price">
                                        {gameData[key].price_overview ?
                                            <>
                                                {gameData[key].price_overview.initial_formatted !== "" ?
                                                    <p className="priceInitial">{gameData[key].price_overview.initial_formatted}</p>
                                                    : null
                                                }
                                                <p className="priceFinal">{gameData[key].price_overview.final_formatted}</p>
                                            </>
                                            : <p className="priceFinal">Free</p>
                                        }
                                    </span>
                                </div>

                                {/* lowest price */}
                                <div className="gameLowestPrice">
                                    <p className="lowestPriceTitle">Lowest Price</p>
                                </div>

                                {/* playing the game now */}
                                <div className="gamePlayingNow">
                                    <p className="playingNowTitle">Playing Now</p>
                                </div>

                                {/* game review percentage */}
                                <div className="gamePercent">
                                    <p className="reviewPercentTitle">Rating</p>
                                    <p className="reviewPercent">
                                        {isNaN((Math.round(((gameData[key].reviews.total_positive / gameData[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2)) === false
                                            ? <>{(Math.round(((gameData[key].reviews.total_positive / gameData[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2)}%</>
                                            : "No Reviews"
                                        }
                                    </p>
                                    <p className="reviewTotal">
                                        {gameData[key].reviews.total_reviews !== 0
                                            ? <>{gameData[key].reviews.total_reviews} Reviews</>
                                            : null
                                        }
                                    </p>
                                </div>
                            </a>
                        </li>
                        : null
                ))}
            </ul>
        </div >
    )
}
export default WishlistInner;