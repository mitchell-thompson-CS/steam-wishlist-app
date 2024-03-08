import GameSidebar from "./GameSidebar"

import '../../styles/Game.css';
import GameContent from "./GameContent";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setEvent, setLoading } from "../../actions/eventAction";
import { addGame } from "../../actions/gameAction";
import AddGameToWishlistPopup from "../Popups/AddGameToWishlistPopup";

const Game = () => {
    let { id } = useParams();
    const gameData = useSelector(state => state.gameReducer.games);
    const addingGame = useSelector(state => state.eventReducer.addingGame);
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
                    } else {
                        dispatch(setEvent(false, "Error fetching game data"));
                    }
                    dispatch(setLoading(false));
                });

        }
    }, [id, gameData, dispatch]);

    return (
        <>
        <AddGameToWishlistPopup trigger={addingGame} />
        <div className="game">
            <GameSidebar />
            <GameContent />
            <div className="clear"></div>
        </div>
        </>
    )
}

export default Game;