import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { addGame } from '../../../actions/gameAction';

import '../../../styles/GameDLC.css';
import loadingImage from '../../../resources/rolling-loading.apng';
import blankHeader from '../../../resources/blank-header.png';

const GameDLC = () => {
    const gameData = useSelector(state => state.gameReducer.games);
    const dispatch = useDispatch();
    let { id } = useParams();
    let [gettingDLCInfo, setGettingDLCInfo] = useState(false);

    useEffect(() => {
        if (gameData[id] && Array.isArray(gameData[id].dlc) && gameData[id].dlc.length > 0) {
            let need_info = [];
            for (let dlc_id of gameData[id].dlc) {
                if (!gameData[dlc_id] || gameData[dlc_id].cache === false) {
                    need_info.push(dlc_id);
                }
            }

            if (need_info.length > 0) {
                async function getData() {
                    try {
                        let data = await axios.get('/api/games/' + JSON.stringify(need_info));
                        if (data.status === 200) {
                            data = data.data;
                            for (let key of Object.keys(data)) {
                                if ((gameData[key] === undefined || !gameData[key].cache) && JSON.stringify(gameData[key]) !== JSON.stringify(data[key])) {
                                    dispatch(addGame(key, data[key]));
                                }
                            }
                        }
                        setTimeout(() => {
                            setGettingDLCInfo(false);
                        }, 5000);
                    } catch (e) {
                        console.log("Error getting DLC information: " + e);
                    }
                }

                if (!gettingDLCInfo) {
                    setGettingDLCInfo(true);
                    getData();
                }
            }
        }
    }, [gameData, id, gettingDLCInfo, dispatch]);

    return (
        gameData[id] && Array.isArray(gameData[id].dlc) && gameData[id].dlc.length > 0 ?
            <div className="game-content-section">
                <div className="game-content-section-header">
                    <h2>Game DLC</h2>
                </div>
                <div className="game-content-section-body" id="dlc-body">
                    {[...gameData[id].dlc].map((x, i) => {
                        return gameData[x] ?
                            <Link to={"/game/" + x} key={i} className='dlc-entry' title={gameData[x].name}>
                                {gameData[x].header_image !== "" ?
                                    <img className='dlc-blank-img' src={gameData[x].header_image} alt="Loading..." /> :
                                    <img className='dlc-blank-img' src={blankHeader} alt="Loading..." />}
                                <h3>{gameData[x].name}</h3>
                                <div className="dlc-price">
                                    <div>
                                        {gameData[x].price_overview &&
                                            gameData[x].price_overview.initial_formatted !== null ?
                                            <>
                                                {gameData[x].price_overview.initial_formatted !== "" && gameData[x].price_overview.initial_formatted !== undefined ?
                                                    <p className="priceInitial-game">{gameData[x].price_overview.initial_formatted}</p>
                                                    : null}
                                                <p className="priceFinal-game" id={gameData[x].price_overview.initial_formatted !== "" && gameData[x].price_overview.initial_formatted !== undefined ?
                                                    "sale-price" : ""}>
                                                    {gameData[x].price_overview.is_free ? "Free" :
                                                        (gameData[x].price_overview.final_formatted !== undefined ? gameData[x].price_overview.final_formatted : "Not Listed")}
                                                </p>
                                            </>
                                            : gameData[x].cache === false ?
                                                <img src={loadingImage} alt="loading" className='loading-dlc' />
                                                : <p className='priceFinal-game'>Not Listed</p>
                                        }
                                    </div>
                                </div>
                            </Link>
                            :
                            <img className="loading-dlc dlc-entry" src={loadingImage} alt="loading..." key={i} />
                    })}
                </div>
            </div>
            : null
    )
}

export default GameDLC;