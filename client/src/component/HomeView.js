import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import '../styles/HomeView.css';
import { Link } from "react-router-dom";
import { setEvent, setLoading } from "../actions/eventAction";
import Footer from "./Footer.js";

const HomeView = () => {
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const [gettingGameData, setGettingGameData] = useState(false);
    const user = useSelector(state => state.userReducer.user);
    const dispatch = useDispatch();
    const [featuredGames, setFeaturedGames] = useState(null);
    const [topGames, setTopGames] = useState(null);
    const [trendingIsExpanded, setTrendingIsExpanded] = useState(false);
    const [topIsExpanded, setTopIsExpanded] = useState(false);

    let interval = useRef(null);
    const [intervalPing, setIntervalPing] = useState(true);

    useEffect(() => {
        async function fetchFeaturedGames() {
            if (!gettingGameData && featuredGames === null && topGames === null) {
                setGettingGameData(true);
                try {
                    dispatch(setLoading(true));
                    await fetch('/api/home/featured', { mode: 'cors', credentials: 'include' })
                        .then(function (response) {
                            if (response.status === 200) {
                                return response.json();
                            } else {
                                throw new Error("Error getting featured games");
                            }
                        }).then(function (data) {
                            if (data) {
                                setFeaturedGames(data);
                            }
                        })
                    await fetch('/api/home/top-sellers', { mode: 'cors', credentials: 'include' })
                        .then(function (response) {
                            if (response.status === 200) {
                                return response.json();
                            } else {
                                throw new Error("Error getting top selling games");
                            }
                        }).then(function (data) {
                            if (data) {
                                setTopGames(data);
                            }
                        })
                } catch (error) {
                    console.error(error);
                    setFeaturedGames([]);
                    setTopGames([]);
                }
                setGettingGameData(false);
                dispatch(setLoading(false));
            }
        }

        fetchFeaturedGames();
        // const interval = setInterval(() => {
        //     let anyFalse = false;
        //     if(featuredGames !== null && typeof featuredGames === 'object'){
        //         for (let key of Object.keys(featuredGames)) {
        //             console.log(key + ", " + featuredGames[key].cache);
        //             if (!featuredGames[key].cache) {
        //                 anyFalse = true;
        //             }
        //         }
        //     }

        //     if (topGames !== null) {
        //         topGames.forEach(element => {
        //             if (!element.cache) {
        //                 anyFalse = true;
        //             }
        //         });
        //     }

        //     if (!anyFalse) {
        //         clearInterval(interval);
        //     }
        // }, 3000);

    }, [dispatch, gettingGameData, featuredGames, topGames]);

    // creates an interval on mount and clears it on dismount
    useEffect(() => {
        createInterval();

        return () => {
            clearInterval(interval.current);
            interval.current = 0;
        }
    }, []);

    /** Creates interval that flips between true and false
     * 
     * @param {Number} delay
     */
    function createInterval(delay = 3000) {
        let curPing = true;
        interval.current = setInterval(() => {
            curPing = !curPing;
            setIntervalPing(curPing);
        }, delay);
    }

    const toggleExpandTrending = () => {
        setTrendingIsExpanded(!trendingIsExpanded);
    }

    const trendingHeight = trendingIsExpanded ? 'none' : '480px';

    const toggleExpandTop = () => {
        setTopIsExpanded(!topIsExpanded);
    }

    const topHeight = topIsExpanded ? 'none' : '480px';

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
        let num;
        if (!featuredGames[key]) {
            num = topGames[key].reviews.review_percentage;
        } else {
            num = featuredGames[key].reviews.review_percentage;
        }
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
        <>
            <div className="homeView">
                {user && Object.keys(user).length > 0 ?
                    <div id="homeWishlists">
                        <div id="homeWishlistHeader" className="homeHeader">
                            <div className="homeHeaderLeft">
                                <h1>YOUR WISHLISTS</h1>
                            </div>
                        </div>
                        <div id="noWishlists">
                            {(wishlistItems.owned || wishlistItems.shared) ? "" : "No Wishlists"}
                        </div>
                        <div className="wishlistRow">
                            {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                                <div key={key} className="rowItemContainer" title={value.name} >
                                    <Link className="rowItem" to={"/wishlists/" + key}>
                                        <h2>{value.name}</h2>
                                        <p>
                                            {value.games ? Object.keys(value.games).length : 0}
                                            {value.games && Object.keys(value.games).length === 1 ? " Game" : " Games"}
                                        </p>
                                    </Link>
                                </div>
                            ))}
                            {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                                <div key={key} className="rowItemContainer" title={value.name}>
                                    <Link className="rowItem" to={"/wishlists/" + key}>
                                        <h2>{value.name}</h2>
                                        <p>
                                            {value.games ? Object.keys(value.games).length : 0}
                                            {value.games && Object.keys(value.games).length === 1 ? " Game" : " Games"}
                                        </p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                    : null}
                <div id="homeTrending">
                    <div id="homeTrendingHeader" className="homeHeader">
                        <div className="homeHeaderLeft">
                            <h1>TRENDING GAMES</h1>
                        </div>
                    </div>
                    <div className="listContainer" style={{ maxHeight: trendingHeight }}>
                        <ul id="trendingGames">
                            {featuredGames && Object.entries(featuredGames).map(([key, value]) => (
                                featuredGames[key] ?
                                    <li key={key} className="gameItem" title={featuredGames[key].name}>
                                        <a href={"/game/" + key} className="gameLink">
                                            {/* title */}
                                            <div className="gameTitleHome">
                                                <h1 className="gameName">{featuredGames[key].name}</h1>
                                                <img src={featuredGames[key].header_image} alt="game thumbnail" />
                                            </div>

                                            {/* price */}
                                            <div className="gamePrice">
                                                <p className="priceTitle">Price</p>
                                                <span className="price">
                                                    {featuredGames[key].price_overview ?
                                                        <>
                                                            {featuredGames[key].price_overview.initial_formatted !== "" &&  featuredGames[key].price_overview.initial_formatted !== undefined ?
                                                                <p className="priceInitial">{featuredGames[key].price_overview.initial_formatted}</p>
                                                                : null
                                                            }
                                                            <p className={"priceFinal " + (featuredGames[key].price_overview.initial_formatted !== "" && featuredGames[key].price_overview.initial_formatted !== undefined ? "sale-price" : "")}>
                                                                {featuredGames[key].price_overview.is_free ? "Free" :
                                                                    (featuredGames[key].price_overview.final_formatted !== undefined ? featuredGames[key].price_overview.final_formatted : "Not Listed")}
                                                            </p>
                                                        </>
                                                        : <p className="priceFinal">Not Listed</p>
                                                    }
                                                </span>
                                            </div>

                                            {/* lowest price */}
                                            <div className="gameLowestPrice">
                                                <p className="lowestPriceTitle">Lowest Price</p>
                                                {featuredGames[key].price_overview && featuredGames[key].price_overview.lowestprice && featuredGames[key].price_overview.final_formatted ?
                                                    <p className="lowestPrice">
                                                        {"$" + featuredGames[key].price_overview.lowestprice}
                                                    </p> :
                                                    <p className="noLowest lowestPrice">
                                                        {featuredGames[key].price_overview && featuredGames[key].price_overview.is_free ? "Free" : 
                                                        (!featuredGames[key].price_overview || featuredGames[key].price_overview.final_formatted === undefined ? "Not Listed" : "No Lowest")}
                                                    </p>
                                                }
                                            </div>

                                            {/* playing the game now */}
                                            <div className="gamePlayingNow">
                                                <p className="playingNowTitle">Playing Now</p>
                                                <p className={"playingNow " + (featuredGames[key] !== undefined && featuredGames[key].playingnow && featuredGames[key].playingnow.player_count > 0 ? "" : " noPlayers")}>
                                                    {featuredGames[key] !== undefined && featuredGames[key].playingnow && featuredGames[key].playingnow.player_count > 0 ?
                                                        <>
                                                            {featuredGames[key].playingnow.player_count}
                                                        </>
                                                        :
                                                        <>
                                                            No players
                                                        </>
                                                    }
                                                </p>
                                            </div>

                                            {/* game review percentage */}
                                            <div className="gamePercent">
                                                <p className="reviewPercentTitle">Rating</p>
                                                {getReviewPercent(key)}
                                            </div>
                                        </a>
                                    </li>
                                    : null
                            ))}
                        </ul>
                    </div>
                    <span className="viewMore" onClick={toggleExpandTrending}>{trendingIsExpanded ? 'View Less' : 'View More'}</span>
                </div>

                <div id="homeTopSellers">
                    <div id="homeTopSellersHeader" className="homeHeader">
                        <div className="homeHeaderLeft">
                            <h1>TOP SELLERS</h1>
                        </div>
                    </div>
                    <div className="listContainer" style={{ maxHeight: topHeight }}>
                        <ul id="trendingGames">
                            {topGames && Object.entries(topGames).map(([key, value], index) => (
                                topGames[key] ?
                                    <li key={key} className="gameItem" title={topGames[key].name}>
                                        <a href={"/game/" + topGames[key].appid} className="gameLink">
                                            <p className="topRanking">{index + 1}</p>
                                            {/* title */}
                                            <div className="gameTitleHome topTitle">
                                                <h1 className="gameName">{topGames[key].name}</h1>
                                                <img src={topGames[key].header_image} alt="game thumbnail" />
                                            </div>

                                            {/* price */}
                                            <div className="gamePrice">
                                                <p className="priceTitle">Price</p>
                                                <span className="price">
                                                    {topGames[key].price_overview ?
                                                        <>
                                                            {topGames[key].price_overview.initial_formatted !== ""  &&  topGames[key].price_overview.initial_formatted !== undefined ?
                                                                <p className="priceInitial">{topGames[key].price_overview.initial_formatted}</p>
                                                                : null
                                                            }
                                                            <p className={"priceFinal " + (topGames[key].price_overview.initial_formatted !== "" && topGames[key].price_overview.initial_formatted !== undefined ? "sale-price" : "")}>
                                                                {topGames[key].price_overview.is_free ? "Free" :
                                                                    (topGames[key].price_overview.final_formatted !== undefined ? topGames[key].price_overview.final_formatted : "Not Listed")}
                                                            </p>
                                                        </>
                                                        : <p className="priceFinal">Free</p>
                                                    }
                                                </span>
                                            </div>

                                            {/* lowest price */}
                                            <div className="gameLowestPrice">
                                                <p className="lowestPriceTitle">Lowest Price</p>
                                                {topGames[key].price_overview && topGames[key].price_overview.lowestprice && topGames[key].price_overview.final_formatted ?
                                                    <p className="lowestPrice">
                                                        {"$" + topGames[key].price_overview.lowestprice}
                                                    </p> :
                                                    <p className="noLowest lowestPrice">
                                                        {topGames[key].price_overview && topGames[key].price_overview.is_free ? "Free" : 
                                                        (!topGames[key].price_overview || topGames[key].price_overview.final_formatted === undefined ? "Not Listed" : "No Lowest")}
                                                    </p>
                                                }
                                            </div>

                                            {/* playing the game now */}
                                            <div className="gamePlayingNow">
                                                <p className="playingNowTitle">Playing Now</p>
                                                <p className={"playingNow " + (topGames[key] !== undefined && topGames[key].playingnow && topGames[key].playingnow.player_count > 0 ? "" : " noPlayers")}>
                                                    {topGames[key] !== undefined && topGames[key].playingnow && topGames[key].playingnow.player_count > 0 ?
                                                        <>
                                                            {topGames[key].playingnow.player_count}
                                                        </>
                                                        :
                                                        <>
                                                            No players
                                                        </>
                                                    }
                                                </p>
                                            </div>

                                            {/* game review percentage */}
                                            <div className="gamePercent">
                                                <p className="reviewPercentTitle">Rating</p>
                                                {getReviewPercent(key)}
                                            </div>
                                        </a>
                                    </li>
                                    : null
                            ))}
                        </ul>
                    </div>
                    <span className="viewMore" onClick={toggleExpandTop}>{topIsExpanded ? 'View Less' : 'View More'}</span>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default HomeView;