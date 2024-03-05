import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist } from "../actions/wishlistAction";
import axios from "axios";
import '../styles/WishlistInner.css';
import { useParams } from "react-router-dom";
import { setLoading, setSearchPopup } from "../actions/eventAction";
import { addGame, removeGame } from "../actions/gameAction";

const WishlistInner = () => {
    const [wishlistItem, setWishlistItem] = useState([]);
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const gameData = useSelector(state => state.gameReducer.games);
    const user = useSelector(state => state.userReducer.user);
    const [gettingGameData, setGettingGameData] = useState(false)
    const [gettingWishlistData, setGettingWishlistData] = useState(false)
    let { id } = useParams();
    const dispatch = useDispatch();

    useEffect(() => {
        async function fetchWishlistData() {
            let data;
            let wishlistFound = (id && wishlistItems !== undefined && wishlistItems.owned !== undefined && wishlistItems.shared !== undefined &&
                (wishlistItems.owned[id] !== undefined || wishlistItems.shared[id] !== undefined));
            if (!wishlistFound && !gettingWishlistData) {
                setGettingWishlistData(true);
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
                        dispatch(createWishlist(data.id, data.name, "owned"));
                    } else if (data.editors[user.id] !== undefined) {
                        dispatch(createWishlist(data.id, data.name, "shared"));
                    }
                }
            } else if (!gettingWishlistData) {
                if (wishlistItems.owned[id] !== undefined) {
                    data = wishlistItems.owned[id];
                } else if (wishlistItems.shared[id] !== undefined) {
                    data = wishlistItems.shared[id];
                }
            }
            if (!data) {
                return;
            }
            setWishlistItem(data);
            setGettingWishlistData(false);
        }

        async function fetchGameData(data) {
            if (!gettingGameData) {
                setGettingGameData(true);
                for (const [key, value] of Object.entries(data.games)) {
                    // console.log(gameData[key]);
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
                                })
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
                setGettingGameData(false);
                dispatch(setLoading(false));
            }
        }

        fetchWishlistData().then(() => {
            if (wishlistItem.games !== undefined && Object.keys(wishlistItem.games).length > 0){
                fetchGameData(wishlistItem);
            }
        });
    }, [id, wishlistItems, user, dispatch, gameData, gettingGameData, gettingWishlistData, wishlistItem]);

    function enableSearchPopup() {
        dispatch(setSearchPopup(true, id));
    }

    return (
        <div className="wishlistInner">
            {/* <div className="listContainer"> */}
            <ul className="gameList">
                <li className="gameItem" id="wishlistInner-addgame" onClick={enableSearchPopup}>
                    <h2>Add Game To Wishlist</h2>
                </li>
                {wishlistItem.games && Object.entries(wishlistItem.games).map(([key, value]) => (
                    gameData[key] ?
                    <a href={"/game/" + key} key={key} className="gameLink" title={gameData[key].name}>
                        <li className="gameItem">
                            {/* <div className="gameContainer"> */}
                            
                            <div className="gameTitle">
                                <h1 className="gameName">{gameData[key].name}</h1>
                                <img src={gameData[key].header_image} alt="game thumbnail" />
                            </div>
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
                            <div className="gameLowestPrice">
                                <p className="lowestPriceTitle">Lowest Price</p>
                            </div>
                            <div className="gamePlayingNow">
                                <p className="playingNowTitle">Playing Now</p>
                            </div>
                            <div className="gamePercent">
                                <p className="reviewPercentTitle">Rating</p>
                                <p className="reviewPercent">
                                    {isNaN((Math.round(((gameData[key].reviews.total_positive / gameData[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2)) === false
                                        ? <>{(Math.round(((gameData[key].reviews.total_positive / gameData[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2)}%</>
                                        : "No Reviews"
                                    }
                                </p>
                            </div>
                            {/* </div> */}
                        </li>
                        </a>
                        : null
                ))}
            </ul>
            {/* </div> */}
            {/* <button onClick={() => addGameToWishlist(id)}>Add Game to Wishlist</button> */}
        </div >
    )
}
export default WishlistInner;