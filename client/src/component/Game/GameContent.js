import '../../styles/GameContent.css';
import GameDLC from './Content/GameDLC';
import GameRequirements from './Content/GameRequirements';
const GameContent = () => {
    return (
        <div id="game-content">
            <GameRequirements/>
            <GameDLC/>
        </div>
    )
}

export default GameContent;