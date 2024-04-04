import { ADD_GAME, REMOVE_GAME, RESET_GAMES } from "../actionTypes/actionTypes"

const addGame = (newGameId, newGameData) => {
    return {
        type: ADD_GAME,
        payload: {
            gameId: newGameId,
            gameData: newGameData
        }
    }
}

const removeGame = (gameId) => {
    return {
        type: REMOVE_GAME,
        payload: {
            gameId: gameId
        }
    }
}

const resetGames = () => {
    return {
        type: RESET_GAMES
    }
}

export { addGame, removeGame, resetGames }