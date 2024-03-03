import GameSidebar from "./GameSidebar"

import '../styles/Game.css';
import GameContent from "./GameContent";

const Game = () => {
    return (
        <div className="game">
            <GameSidebar />
            <GameContent />
        </div>
    )
}

export default Game;