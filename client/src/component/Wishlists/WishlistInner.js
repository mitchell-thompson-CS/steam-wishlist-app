import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteGameFromWishlist, deleteWishlist, setWishlist } from "../../actions/wishlistAction";
import axios from "axios";
import '../../styles/WishlistInner.css';
import { useNavigate, useParams } from "react-router-dom";
import { setEvent, setLoading, setSearchPopup } from "../../actions/eventAction";
import { addGame, removeGame } from "../../actions/gameAction";
import RenameWishlistPopup from "../Popups/RenameWishlistPopup";
import DeleteWishlistPopup from "../Popups/DeleteWishlistPopup";
import { isUser } from "../../actions/userAction";

import loadingImage from '../../resources/rolling-loading.apng';

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
    const [settingsPopup, setSettingsPopup] = useState(false);
    const [renamePopup, setRenamePopup] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    let { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [loadingGames, setLoadingGames] = useState(false);

    useEffect(() => {
        // fetches the wishlist data for the current wishlist
        async function fetchWishlistData() {
            let data;
            let wishlistFound = (id && wishlistItems !== undefined && wishlistItems.owned !== undefined && wishlistItems.shared !== undefined &&
                (wishlistItems.owned[id] !== undefined || wishlistItems.shared[id] !== undefined));
            if (!wishlistFound && !gettingWishlistData.current) {
                gettingWishlistData.current = true;
                dispatch(setLoading(true));
                let response = await fetch('/api/wishlist/' + id, { mode: 'cors', credentials: 'include' });
                dispatch(setLoading(false));
                if (response.status !== 200) {
                    if (user && Object.keys(user).length > 0) {
                        if (response.status === 401) {
                            dispatch(setEvent(false, "You are not logged in"));
                        } else if (response.status === 403) {
                            dispatch(setEvent(false, "You do not have access to this wishlist"));
                        } else {
                            dispatch(setEvent(false, "Error fetching wishlist data"));
                        }
                    }
                    return false;
                }
                data = await response.json();

                // now need to update redux store with this new wishlist in the correct spot
                if (data !== null && user !== undefined && user.id !== undefined) {
                    if (user.id === data.owner) {
                        dispatch(setWishlist(id, "owned", data));
                    } else if (data.editors[user.id] !== undefined) {
                        dispatch(setWishlist(id, "shared", data));
                    }
                    setWishlistItem(data);
                }
            } else if (!gettingWishlistData.current) {
                // update the data with the current wishlist if it already exists
                if (wishlistItems.owned && wishlistItems.owned[id] !== undefined) {
                    data = wishlistItems.owned[id];
                } else if (wishlistItems.shared && wishlistItems.shared[id] !== undefined) {
                    data = wishlistItems.shared[id];
                }
            }

            if (gettingWishlistData.current) {
                return true;
            }

            if (!data) {
                return false;
            }

            setWishlistItem(data);
            gettingWishlistData.current = false;
            return true;
        }

        async function handleWishlistData() {
            let success = await fetchWishlistData();
            if (!success && user && Object.keys(user).length > 0) {
                navigate("/wishlists");
            }
        }
        // if the wishlistItem is not already set, we want to fetch the wishlist data
        // fetchWishlistData();
        handleWishlistData();
    }, [id, wishlistItems, user, dispatch, navigate]);

    useEffect(() => {
        // fetches the game data for each game in the wishlist
        async function fetchGameData(data) {
            if (!gettingGameData && data && data.games && gameData !== undefined) {
                setGettingGameData(true);
                let arr = [];
                for (const [key, value] of Object.entries(data.games)) {
                    if (gameData[key] === undefined) {
                        arr.push(key);
                    }
                }
                try {
                    if (arr.length === 0) {
                        setGettingGameData(false);
                        return;
                    }
                    setLoadingGames(true);
                    let res = await axios.get('/api/games/' + JSON.stringify(arr));
                    if (res.status === 200) {
                        for (const [key, value] of Object.entries(res.data)) {
                            if (gameData[key] === undefined) {
                                dispatch(addGame(key, value));
                            }
                        }
                    }
                } catch (e) {
                    dispatch(setEvent(false, "Error fetching game data"));
                }

                setLoadingGames(false);
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

    let closeSettingsPopup;

    const closeSettingsPopupClick = useCallback((e) => {
        if (e.target.id === "options-mini-dropdown-bkg") {
            closeSettingsPopup();
        }
    }, [closeSettingsPopup]);

    closeSettingsPopup = useCallback(() => {
        setSettingsPopup(false);
        document.removeEventListener('click', closeSettingsPopupClick);
    }, [closeSettingsPopupClick]);

    useEffect(() => {
        if (settingsPopup) {
            document.addEventListener('click', closeSettingsPopupClick);
        }
    }, [settingsPopup, closeSettingsPopupClick]);

    useEffect(() => {
        if (!user || Object.keys(user).length === 0) {
            navigate("/");
        }
    }, [user, navigate]);

    function getReviewColor(value) {
        if (isNaN(value)) {
            return "#888888";
        } else if (value > 80) {
            return "lightskyblue";
        } else if (value > 50) {
            return "#ffff00";
        } else {
            return "#ff0000";
        }
    }

    function getReviewPercent(key) {
        let num = (Math.round(((gameData[key].reviews.total_positive / gameData[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2);
        return (
            <p className="reviewPercent" style={{
                color: getReviewColor(num)
            }}>
                {isNaN(num) === false
                    ? <>{num}%</>
                    : "No Reviews"
                }
            </p>
        )
    }

    return (
        <div className="wishlistInner">
            <RenameWishlistPopup trigger={renamePopup} setTrigger={setRenamePopup} id={id} wishlist={wishlistItem} />
            <DeleteWishlistPopup trigger={deletePopup} setTrigger={setDeletePopup} id={id} wishlist={wishlistItem} disableGettingData={gettingWishlistData} />
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
                                <p id="num-selected-mini">{removeGameList.list.length} selected</p>
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

                    {wishlistItem ?
                        <div id="wishlistInner-options-mini">
                            <div id="options-mini-container">
                                <div id="options-mini-svg" onClick={
                                    () => {
                                        setSettingsPopup(!settingsPopup);
                                    }
                                }>
                                    <svg id="options-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px">    <path d="M 10.490234 2 C 10.011234 2 9.6017656 2.3385938 9.5097656 2.8085938 L 9.1757812 4.5234375 C 8.3550224 4.8338012 7.5961042 5.2674041 6.9296875 5.8144531 L 5.2851562 5.2480469 C 4.8321563 5.0920469 4.33375 5.2793594 4.09375 5.6933594 L 2.5859375 8.3066406 C 2.3469375 8.7216406 2.4339219 9.2485 2.7949219 9.5625 L 4.1132812 10.708984 C 4.0447181 11.130337 4 11.559284 4 12 C 4 12.440716 4.0447181 12.869663 4.1132812 13.291016 L 2.7949219 14.4375 C 2.4339219 14.7515 2.3469375 15.278359 2.5859375 15.693359 L 4.09375 18.306641 C 4.33275 18.721641 4.8321562 18.908906 5.2851562 18.753906 L 6.9296875 18.1875 C 7.5958842 18.734206 8.3553934 19.166339 9.1757812 19.476562 L 9.5097656 21.191406 C 9.6017656 21.661406 10.011234 22 10.490234 22 L 13.509766 22 C 13.988766 22 14.398234 21.661406 14.490234 21.191406 L 14.824219 19.476562 C 15.644978 19.166199 16.403896 18.732596 17.070312 18.185547 L 18.714844 18.751953 C 19.167844 18.907953 19.66625 18.721641 19.90625 18.306641 L 21.414062 15.691406 C 21.653063 15.276406 21.566078 14.7515 21.205078 14.4375 L 19.886719 13.291016 C 19.955282 12.869663 20 12.440716 20 12 C 20 11.559284 19.955282 11.130337 19.886719 10.708984 L 21.205078 9.5625 C 21.566078 9.2485 21.653063 8.7216406 21.414062 8.3066406 L 19.90625 5.6933594 C 19.66725 5.2783594 19.167844 5.0910937 18.714844 5.2460938 L 17.070312 5.8125 C 16.404116 5.2657937 15.644607 4.8336609 14.824219 4.5234375 L 14.490234 2.8085938 C 14.398234 2.3385937 13.988766 2 13.509766 2 L 10.490234 2 z M 12 8 C 14.209 8 16 9.791 16 12 C 16 14.209 14.209 16 12 16 C 9.791 16 8 14.209 8 12 C 8 9.791 9.791 8 12 8 z" /></svg>
                                </div>
                                <div id="options-mini-dropdown" style={{
                                    visibility: settingsPopup ? "visible" : "hidden",
                                    opacity: settingsPopup ? "1" : "0"
                                }}>
                                    <ul>
                                        <li onClick={() => {
                                            setRenamePopup(true);
                                            closeSettingsPopup();
                                        }}>Rename Wishlist</li>
                                        <li onClick={() => {
                                            setDeletePopup(true);
                                            closeSettingsPopup();
                                        }}>Delete Wishlist</li>
                                    </ul>
                                </div>
                                <div id="options-mini-dropdown-bkg" style={{
                                    display: settingsPopup ? "block" : "none"
                                }}></div>
                            </div>
                        </div> : null
                    }
                </div>
            </div>
            {/* actual main content of this page, listing the games */}
            <ul className="gameList">
                {wishlistItem.games && Object.entries(wishlistItem.games).map(([key, value]) => (
                    gameData[key] ?
                        <li key={key} className="gameItem" title={gameData[key].name}>
                            {/* selecting the game for deletion */}
                            <div className="gameSelectSection" onClick={
                                (e) => {
                                    let checkbox = document.getElementById("gameSelect" + key);
                                    if (checkbox) {
                                        if (removeGameList.list.includes(key)) {
                                            let newList = removeGameList.list.filter((item) => item !== key);
                                            setRemoveGameList({
                                                list: newList
                                            });
                                            checkbox.checked = false;
                                        } else {
                                            setRemoveGameList({
                                                list: [...removeGameList.list, key]
                                            });
                                            checkbox.checked = true;
                                        }
                                    }
                                }

                            }>
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
                                                <p className={"priceFinal " + (gameData[key].price_overview.initial_formatted !== "" ? "sale-price" : "")}>{gameData[key].price_overview.final_formatted}</p>
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
                                    <p className="playingNow">
                                        {gameData[key].playingnow.player_count}
                                    </p>
                                </div>

                                {/* game review percentage */}
                                <div className="gamePercent">
                                    <p className="reviewPercentTitle">Rating</p>
                                    {getReviewPercent(key)}
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
                {loadingGames
                    ? <img src={loadingImage} alt="loading" id="wishlistInner-loading" />
                    : null}
            </ul>
        </div >
    )
}
export default WishlistInner;