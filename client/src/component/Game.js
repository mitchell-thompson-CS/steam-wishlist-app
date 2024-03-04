import GameSidebar from "./GameSidebar"

import '../styles/Game.css';
import GameContent from "./GameContent";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../actions/eventAction";
import { addGame } from "../actions/gameAction";

const Game = () => {
    let { id } = useParams();
    const gameData = useSelector(state => state.gameReducer.games);
    const dispatch = useDispatch();

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

    return (
        <div className="game">
            <GameSidebar />
            <GameContent />
            <div className="clear"></div>
        </div>
    )
}

export default Game;