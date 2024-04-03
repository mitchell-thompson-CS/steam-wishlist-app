import React, { useState, useEffect } from "react";
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
    }, [dispatch, gettingGameData, featuredGames, topGames]);

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
            num = (Math.round(((topGames[key].reviews.total_positive / topGames[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2);
        } else {
            num = (Math.round(((featuredGames[key].reviews.total_positive / featuredGames[key].reviews.total_reviews) * 100) * 100) / 100).toFixed(2);
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
                                                    {featuredGames[key].price_overview && featuredGames[key].price_overview.final_formatted ?
                                                        <>
                                                            {featuredGames[key].price_overview.initial_formatted !== "" ?
                                                                <p className="priceInitial">{featuredGames[key].price_overview.initial_formatted}</p>
                                                                : null
                                                            }
                                                            <p className={"priceFinal " + (featuredGames[key].price_overview.initial_formatted !== "" ? "sale-price" : "")}>{featuredGames[key].price_overview.final_formatted}</p>
                                                        </>
                                                        : <p className="priceFinal">Free</p>
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
                                                    <p className="noLowest lowestPrice">No Lowest</p>
                                                }
                                            </div>

                                            {/* playing the game now */}
                                            <div className="gamePlayingNow">
                                                <p className="playingNowTitle">Playing Now</p>
                                                <p className="playingNow">
                                                    {featuredGames[key].playingnow.player_count}
                                                </p>
                                            </div>

                                            {/* game review percentage */}
                                            <div className="gamePercent">
                                                <p className="reviewPercentTitle">Rating</p>
                                                {getReviewPercent(key)}
                                                <p className="reviewTotal">
                                                    {featuredGames[key].reviews.total_reviews !== 0
                                                        ? <>{featuredGames[key].reviews.total_reviews} Reviews</>
                                                        : null
                                                    }
                                                </p>
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
                                                    {topGames[key].price_overview && topGames[key].price_overview.final_formatted ?
                                                        <>
                                                            {topGames[key].price_overview.initial_formatted !== "" ?
                                                                <p className="priceInitial">{topGames[key].price_overview.initial_formatted}</p>
                                                                : null
                                                            }
                                                            <p className={"priceFinal " + (topGames[key].price_overview.initial_formatted !== "" ? "sale-price" : "")}>{topGames[key].price_overview.final_formatted}</p>
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
                                                    <p className="noLowest lowestPrice">No Lowest</p>
                                                }
                                            </div>

                                            {/* playing the game now */}
                                            <div className="gamePlayingNow">
                                                <p className="playingNowTitle">Playing Now</p>
                                                <p className="playingNow">
                                                    {topGames[key].playingnow.player_count}
                                                </p>
                                            </div>

                                            {/* game review percentage */}
                                            <div className="gamePercent">
                                                <p className="reviewPercentTitle">Rating</p>
                                                {getReviewPercent(key)}
                                                <p className="reviewTotal">
                                                    {topGames[key].reviews.total_reviews !== 0
                                                        ? <>{topGames[key].reviews.total_reviews} Reviews</>
                                                        : null
                                                    }
                                                </p>
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