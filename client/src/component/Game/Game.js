import GameSidebar from "./GameSidebar"
import Footer from "../Footer.js";

import '../../styles/Game.css';
import GameContent from "./GameContent";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setEvent, setLoading } from "../../actions/eventAction";
import { addGame } from "../../actions/gameAction";
import AddGameToWishlistPopup from "../Popups/AddGameToWishlistPopup";
import axios from "axios";

import loadingImage from '../../resources/rolling-loading.apng';

const Game = () => {
    let { id } = useParams();
    const gameData = useSelector(state => state.gameReducer.games);
    const addingGame = useSelector(state => state.eventReducer.addingGame);
    const dispatch = useDispatch();
    const [gettingGame, setGettingGame] = useState(false);

    useEffect(() => {
        async function getData() {
            try {
                let data = await axios.get('/api/game/' + id);
                if (data.status === 200) {
                    data = data.data;
                    if ((gameData[id] === undefined || !gameData[id].cache) && JSON.stringify(gameData[id]) !== JSON.stringify(data)) {
                        dispatch(addGame(id, data));
                    }
                }
            } catch (e) {
                console.log("Error getting game information:", e);
            }

            setTimeout(() => {
                setGettingGame(false);
            }, 3000);
        }

        if (!gettingGame && !gameData[id]) {
            // only want to have loading when there is actually no information there
            dispatch(setLoading(true));
            setGettingGame(true);
            getData().then(() => {
                dispatch(setLoading(false));
            })
        } else if (!gettingGame && !gameData[id].cache) {
            setGettingGame(true);
            getData();
        }
    }, [id, gameData, dispatch, gettingGame]);

    return (
        <>
            <AddGameToWishlistPopup trigger={addingGame} />
            <div className="game">
                <GameSidebar />
                <GameContent />

                <div className="clear"></div>
            </div>
            <Footer />
        </>
    )
}

export default Game;