import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { addGame } from "../actions/gameAction";

import '../styles/GameSidebar.css';
import { setLoading } from "../actions/eventAction";
import loadingImage from '../resources/rolling-loading.apng';
import { setAddGameToWishlist } from "../actions/eventAction";

const GameSidebar = () => {
    let { id } = useParams();
    const gameData = useSelector(state => state.gameReducer.games);
    const dispatch = useDispatch();
    const [viewTags, setViewTags] = useState(false);
    const [viewGenres, setViewGenres] = useState(false);
    const [curReviewPercent, setCurReviewPercent] = useState(NaN);
    const user = useSelector(state => state.userReducer.user);

    useEffect(() => {
        if (!gameData[id]) {
            dispatch(setLoading(true));
            fetch('/api/game/' + id, { mode: 'cors', credentials: 'include' })
                .then(function (response) {
                    if (response.status === 200) {
                        return response.json();
                    }
                }).then(function (data) {
                    if (data) {
                        dispatch(addGame(id, data));
                    }
                    dispatch(setLoading(false));
                });

        }
    }, [id, gameData, dispatch]);

    useEffect(() => {
        let wishlistButton = document.getElementById("add-to-wishlist");
        if (wishlistButton !== undefined && wishlistButton !== null) {
            if (user && Object.keys(user).length > 0) {
                wishlistButton.style.fontSize = "";
                wishlistButton.style.backgroundColor = "";
                wishlistButton.style.color = "";
                wishlistButton.style.cursor = ""
            } else {
                wishlistButton.style.fontSize = "14px";
                wishlistButton.style.backgroundColor = "#888888";
                wishlistButton.style.color = "#aaaaaa";
                wishlistButton.style.cursor = "auto"
            }
        }
    }, [user]);

    useEffect(() => {
        if (gameData && gameData[id] && gameData[id].reviews !== undefined &&
            gameData[id].reviews.total_positive !== undefined &&
            gameData[id].reviews.total_reviews !== undefined) {
            let reviewPercent = document.getElementsByClassName("review-percent-game");
            for (let element of reviewPercent) {
                element.style.color = getReviewColor((gameData[id].reviews.total_positive / gameData[id].reviews.total_reviews));
            }

            setCurReviewPercent((Math.round(((gameData[id].reviews.total_positive / gameData[id].reviews.total_reviews) * 100) * 100) / 100).toFixed(2))

        }
    }, [gameData, id]);

    function getReviewColor(value) {
        if (isNaN(value)) {
            return "#888888";
        } else if (value > 0.80) {
            return "lightskyblue";
        } else if (value > 0.5) {
            return "#ffff00";
        } else {
            return "#ff0000";
        }
    }

    function viewAllTags() {
        let tags = document.getElementById("game-tags");
        let tagsMore = document.getElementById("game-tag-more");
        if (tags !== undefined && tags !== null && tagsMore !== undefined && tagsMore !== null
            && tagsMore.children.length > 0) {
            if (viewTags) {
                tags.style.maxWidth = "80%";
                tags.style.overflow = "hidden";
                tags.style.height = "25px";
                tagsMore.children[0].innerText = "View All";
            } else {
                if (tags !== undefined && tags !== null) {
                    tags.style.maxWidth = "100%";
                    tags.style.overflow = "visible";
                    tags.style.height = "auto";
                    tagsMore.children[0].innerText = "View Less";
                }
            }
            setViewTags(!viewTags);
        }
    }

    function viewAllGenres() {
        let tags = document.getElementById("game-genres");
        let tagsMore = document.getElementById("game-genres-more");
        if (tags !== undefined && tags !== null && tagsMore !== undefined && tagsMore !== null
            && tagsMore.children.length > 0) {
            if (viewGenres) {
                tags.style.maxWidth = "80%";
                tags.style.overflow = "hidden";
                tags.style.height = "25px";
                tagsMore.children[0].innerText = "View All";
            } else {
                if (tags !== undefined && tags !== null) {
                    tags.style.maxWidth = "100%";
                    tags.style.overflow = "visible";
                    tags.style.height = "auto";
                    tagsMore.children[0].innerText = "View Less";
                }
            }
            setViewGenres(!viewGenres);
        }
    }

    function addToWishlist() {
        if (user && Object.keys(user).length > 0) {
            // set flag to pull up popup
            dispatch(setAddGameToWishlist(id));
        }
    }

    return (
        <div className="game-info">
            {gameData[id] ?
                <img src={gameData[id].header_image} alt="game header" />
                : <img src={loadingImage} alt="loading" className="loading-header" />
            }
            <div className="game-info-body">
                <h1>{gameData[id] ? gameData[id].name : "Game Title"}</h1>
                <div className="game-info-section"> {/* game description section */}
                    <p>{gameData[id] ? gameData[id].short_description : "Game Description"}</p>
                </div> {/* end of game-info-section */}
                <div className="game-info-section">
                    <div className="game-quick-info no-top-padding"> {/* release date, dev, and pub section */}
                        <h3>Release Date:</h3>
                        <span>
                            {gameData[id] && gameData[id].release_date !== undefined &&
                                gameData[id].release_date.coming_soon !== undefined &&
                                gameData[id].release_date.coming_soon === true
                                ? <div id="game-coming-soon">Coming Soon<br /></div>
                                : null
                            }


                            {gameData[id] && gameData[id].release_date !== undefined &&
                                gameData[id].release_date.date !== undefined
                                ? gameData[id].release_date.date
                                : "No Release Date"
                            }
                        </span>
                        <div className="clear"></div>
                    </div> {/* end of game-quick-info */}
                    <div className="game-quick-info no-top-padding"> {/* developer section */}
                        <h4>Developer:</h4>
                        <span>
                            {gameData[id] && gameData[id].developers !== undefined
                                ? gameData[id].developers.map((dev, index) => {
                                    return <p key={index}>{dev}</p>
                                }) : "No Developer"
                            }
                        </span>
                        <div className="clear"></div>
                    </div> {/* end of game-quick-info */}
                    <div className="game-quick-info no-top-padding"> {/* publisher section */}
                        <h4>Publisher:</h4>
                        <span>
                            {gameData[id] && gameData[id].publishers !== undefined
                                ? gameData[id].publishers.map((dev, index) => {
                                    return <p key={index}>{dev}</p>
                                }) : "No Publisher"
                            }
                        </span>
                        <div className="clear"></div>
                    </div> {/* end of game-quick-info */}
                </div> {/* end of game-info-section */}
                <div className="game-info-section"> {/* genres section */}
                    <div id="game-genres">
                        <h3>Genres:</h3>
                        <span>
                            {gameData[id] && gameData[id].genres !== undefined ? gameData[id].genres.map((genre, index) => {
                                return <span key={index}><p>{genre.description}</p></span>
                            }) : "No Genres"}
                        </span>
                    </div>
                    <div id="game-genres-more">
                        <button onClick={() => {
                            viewAllGenres();
                        }}>View All</button>
                    </div>
                    <div className="clear"></div>
                </div> {/* end of game-info-section */}
                <div className="game-info-section"> {/* tags section */}
                    <div id="game-tags">
                        <h3>Tags:</h3>
                        <span>
                            {gameData[id] && gameData[id].categories !== undefined ? gameData[id].categories.map((tag, index) => {
                                return <span key={index}><p>{tag.description}</p></span>
                            }) : <p>No Tags</p>}
                        </span>
                    </div>
                    <div id="game-tag-more">
                        <button onClick={() => {
                            viewAllTags();
                        }}>View All</button>
                    </div>
                    <div className="clear"></div>
                </div> {/* end of game-info-section */}
                <div className="game-info-section">
                    <div className="game-quick-info"> {/* review section */}
                        <h3>Positive Reviews:</h3>
                        <span className="reviews-game">
                            {gameData[id] !== undefined && gameData[id].reviews &&
                                gameData[id].reviews.total_positive !== null &&
                                gameData[id].reviews.total_reviews !== null
                                ?
                                <p className="review-percent-game">
                                    {isNaN(curReviewPercent) === false
                                        ? <>{curReviewPercent}%</>
                                        : "No Reviews"
                                    }
                                </p>
                                : null
                            }
                        </span>
                        <div className="clear"></div>
                    </div> {/* end of game-quick-info */}
                    <div className="game-quick-info"> {/* price section */}
                        <h3>Current Price:</h3>
                        <span className="price-game">
                            {gameData[id] !== undefined && gameData[id].price_overview &&
                                gameData[id].price_overview.initial_formatted !== null ?
                                <>
                                    {gameData[id].price_overview.initial_formatted !== "" ?
                                        <p className="priceInitial-game">{gameData[id].price_overview.initial_formatted}</p>
                                        : null}
                                    <p className="priceFinal-game" id={gameData[id].price_overview.initial_formatted !== "" ? "sale-price" : ""}>{gameData[id].price_overview.final_formatted}</p>
                                </>
                                : gameData[id] !== undefined ? <p>Free</p> : null
                            }
                        </span>
                        <div className="clear"></div>
                    </div> {/* end of game-quick-info */}
                </div> {/* end of game-info-section */}
                <div className="game-info-section"> {/* view on steam and add to wishlist section */}
                    <a href={"https://store.steampowered.com/app/" + id} className="game-sidebar-button" id="view-on-steam">View on Steam</a>
                    <button className="game-sidebar-button" id="add-to-wishlist" onClick={() => addToWishlist()}>
                        { user && Object.keys(user).length > 0 ?
                            "Add to Wishlist"
                            : "Login to add to wishlist"
                        }
                    </button>
                    <div className="clear"></div>
                </div> {/* end of game-info-section */}
            </div> {/* end of game-info-body */}
        </div> // end of game-info
    )
}

export default GameSidebar;