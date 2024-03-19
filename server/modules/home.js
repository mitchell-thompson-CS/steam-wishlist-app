const { default: axios } = require('axios');
const schedule = require('node-schedule');
const { Logging, LogLevels } = require('./logging.js');
const { getGameData } = require('./game');


let featured = null;
let featured_games = [];

async function getSteamStore() {
    let function_name = getSteamStore.name;
    try {
        let featured_res = await axios.get('https://store.steampowered.com/api/featured/');
        featured = featured_res.data;
        if(!featured){
            Logging.log(function_name, "Error getting featured games", LogLevels.ERROR);
            return;
        }

        featured_games = {};
        for (game of featured['featured_win']) {
            let game_data = await getGameData(game['id']);
            if(game_data && game_data[game['id']] && game_data[game['id']]['success'] === true){
                featured_games[game['id']] = game_data[game['id']]['data'];
            }
        }
    } catch (error) {
        Logging.log(function_name, "Error getting data for featured games: " + error, LogLevels.ERROR);
    }
}

schedule.scheduleJob('0 5 10 * * *', getSteamStore);
// run once on startup
getSteamStore();

async function getFeatured(req, res) {
    let function_name = getFeatured.name;
    if (!featured) {
        Logging.handleResponse(res, 500, null, function_name, "Error getting featured games", LogLevels.ERROR);
    }
    Logging.handleResponse(res, 200, featured_games, function_name, "Got featured games");
}

exports.getFeatured = getFeatured;