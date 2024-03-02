import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { addGame } from "../actions/gameAction";

import '../styles/Game.css';
import { setLoading } from "../actions/eventAction";
import loadingImage from '../resources/rolling-loading.apng';

const Game = () => {
    let { id } = useParams();
    const gameData = useSelector(state => state.gameReducer.games);
    const dispatch = useDispatch();
    const [viewTags, setViewTags] = useState(false);

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

        } else {
            console.log(gameData[id]);

        }
    }, [id, gameData, dispatch]);

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

    return (
        <div className="game">
            <div className="game-info">
                {gameData[id] ?
                    <img src={gameData[id].header_image} alt="game header" />
                    : <img src={loadingImage} alt="loading" className="loading-header" />
                }
                <div className="game-info-body">
                    <h1>{gameData[id] ? gameData[id].name : "Game Title"}</h1>
                    <div className="game-info-section">
                        <p>{gameData[id] ? gameData[id].short_description : "Game Description"}</p>
                    </div>
                    <div className="game-info-section" id="game-tag-section">
                        <div id="game-tags">
                            <h3>Tags:</h3>
                            <span>
                                {gameData[id] && gameData[id].categories !== undefined ? gameData[id].categories.map((tag, index) => {
                                    return <span key={index}><p>{tag.description}</p></span>
                                }) : "Game Tags"}
                            </span>
                        </div>
                        <div id="game-tag-more">
                            <button onClick={() => {
                                viewAllTags();
                            }}>View All</button>
                        </div>
                        <div className="clear"></div>
                    </div>
                    <div className="game-info-section">
                        <div className="game-quick-info">
                            <h2>Current Price:</h2>
                            <span className="price-game">
                                {gameData[id] !== undefined && gameData[id].price_overview &&
                                    gameData[id].price_overview.initial_formatted !== null ?
                                    <>
                                        {gameData[id].price_overview.initial_formatted !== "" ?
                                            <p className="priceInitial-game">{gameData[id].price_overview.initial_formatted}</p>
                                            : null}
                                        <p className="priceFinal-game">{gameData[id].price_overview.final_formatted}</p>
                                    </>
                                    : null}
                            </span>
                            <div className="clear"></div>
                        </div>
                        <div className="game-quick-info">
                            <h2>Current Price:</h2>
                            <span className="price-game">
                                {gameData[id] !== undefined && gameData[id].price_overview &&
                                    gameData[id].price_overview.initial_formatted !== null ?
                                    <>
                                        {gameData[id].price_overview.initial_formatted !== "" ?
                                            <p className="priceInitial-game">{gameData[id].price_overview.initial_formatted}</p>
                                            : null}
                                        <p className="priceFinal-game">{gameData[id].price_overview.final_formatted}</p>
                                    </>
                                    : null}
                            </span>
                            <div className="clear"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Game;