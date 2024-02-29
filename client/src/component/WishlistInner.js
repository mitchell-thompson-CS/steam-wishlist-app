import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createWishlist, deleteWishlist } from "../actions/wishlistAction";
import axios from "axios";
import '../styles/WishlistInner.css';
import { useParams } from "react-router-dom";


async function addGameToWishlist(wishlist, game="105600") {
    try {
        let res = await axios.post('/api/game/add', {
            wishlist_id: wishlist,
            game_id: game
        });
        console.log(res);
    } catch (error) {
        console.log("error")
        console.error(error);
    }
}

const WishlistInner = () => {
    const [wishlistItem, setWishlistItem] = useState([]);
    const [gameData, setGameData] = useState({});
    let { id } = useParams();

    useEffect(() => {
        fetch('/api/wishlist/' + id, { mode: 'cors', credentials: 'include' })
            .then(function (response) {
                if (response.status === 200) {
                    return response.json();
                }
            }).then(function (data) {
                if (data) {
                    setWishlistItem(data);
                    // console.log(data);
                    return data;
                }
            }).then(function (data) {
                for (const [key, value] of Object.entries(data.games)) {
                    console.log(key);
                    try {
                        fetch('/api/game/' + key, { mode: 'cors', credentials: 'include' })
                            .then(function (response2) {
                                if (response2.status === 200) {
                                    return response2.json();
                                }
                            }).then(function (data2) {
                                if (data2) {
                                    console.log({
                                        ...gameData,
                                        [key]: data2
                                    })
                                    setGameData({
                                        ...gameData,
                                        [key]: data2
                                    });
                                    console.log(data2);
                                    return data2;
                                }
                            })
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
    }, [id]);

    return (
        <div className="wishlistInner">
            {/* <div className="listContainer"> */}
                <ul className="gameList">
                    {wishlistItem.games && Object.entries(wishlistItem.games).map(([key, value]) => (
                        gameData[key]?
                        <li key={key} className="gameItem">
                            {/* <div className="gameContainer"> */}
                                <div className="gameTitle">
                                    <a href={"/game/" + key} className="gameLink">{gameData[key].name}</a>
                                    <img src={gameData[key].header_image} alt="game thumbnail"/>
                                </div>
                                <div className="gamePrice">
                                    <p className="priceTitle">Price</p>
                                    <p>{gameData[key].price_overview.final_formatted}</p>
                                </div>
                                <div className="gameLowestPrice">
                                    <p className="lowestPriceTitle">Lowest Price</p>
                                </div>
                                <div className="gamePlayingNow">
                                    <p className="playingNowTitle">Playing Now</p>
                                </div>
                                <div className="gamePercent">
                                    <p className="reviewPercentTitle">Positive Review %</p>
                                    <p>{(Math.round(((gameData[key].reviews.total_positive / gameData[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2)}%</p>
                                </div>
                            {/* </div> */}
                        </li>
                        :null
                    ))}
                </ul>
            {/* </div> */}
            <button onClick={() => addGameToWishlist(id)}>Add Game to Wishlist</button>
        </div>
    )
}
export default WishlistInner;