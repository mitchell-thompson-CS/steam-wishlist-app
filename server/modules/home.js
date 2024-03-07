const { default: axios } = require('axios');
const schedule = require('node-schedule');
const { Logging, LogLevels } = require('./logging.js');
const { getGameData } = require('./game');


let featured = null;

async function getSteamStore() {
    try {
        let featured_res = await axios.get('https://store.steampowered.com/api/featured/');
        featured = featured_res.data;
        if (featured) {
            return featured;
        }
    } catch (error) {
        Logging.log(LogLevels.ERROR, "getSteamStore", "Error getting data for featured games: " + error);
        return null;
    }
}

schedule.scheduleJob('0 5 10 * * *', getSteamStore);

async function getFeatured() {
    let featured_games = [];
    for (game in featured['featured_win']) {
        let game_data = await getGameData(game['id']);
        featured_games.push(game_data);
    }
    return featured_games;
}

exports.getFeatured = getFeatured;