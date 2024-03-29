const { default: axios } = require('axios');
const schedule = require('node-schedule');
const { Logging, LogLevels } = require('./logging.js');
const { getGameData } = require('./game');
require('dotenv').config({ path: __dirname + '/../../.env' });


let featured = null;
let featured_games = {};
let top_sellers = null;
let top_sellers_games = [];
const country = 'US';
const language = 'en';

async function getSteamStore() {
    let function_name = getSteamStore.name;
    try {
        let featured_res = await axios.get('https://store.steampowered.com/api/featured/');
        featured = featured_res.data;
        if (!featured) {
            Logging.log(function_name, "Error getting featured games", LogLevels.ERROR);
            return;
        }

        featured_games = {};
        for (let game of featured['featured_win']) {
            let game_data = await getGameData(game['id']);
            featured_games[game['id']] = game_data;
        }
    } catch (error) {
        Logging.log(function_name, "Error getting data for featured games: " + error, LogLevels.ERROR);
    }
}

async function getSteamTopSellers() {
    let function_name = getSteamTopSellers.name;
    try {
        let res = await axios.get(encodeURI('https://api.steampowered.com/IStoreTopSellersService/GetWeeklyTopSellers/v1/?key=' +
            process.env.STEAM_API_KEY + '&' + 'country_code=' + country + '&input_json={"context":{"language":"' + language + '","country_code":"' + country + '"}}'));
        if (!res.data) {
            Logging.log(function_name, "Error getting top sellers", LogLevels.ERROR);
            return;
        }
        top_sellers = res.data.response.ranks;
        top_sellers_games = [];
        for (let game of top_sellers) {
            let game_data = await getGameData(game['appid']);
            game_data.appid = game['appid'];
            // top_sellers_games[game['appid']] = game_data;
            top_sellers_games.push(game_data);
        }
    } catch (error) {
        Logging.log(function_name, "Error getting data for top sellers: " + error, LogLevels.ERROR);
    }

}

schedule.scheduleJob('0 5 10 * * *', getSteamStore);
schedule.scheduleJob('0 5 10 * * *', getSteamTopSellers);
// run once on startup
getSteamStore();
getSteamTopSellers();

async function getFeatured(req, res) {
    let function_name = getFeatured.name;
    Logging.handleResponse(res, 200, featured_games, function_name, "Got featured games");
}

async function getTopSellers(req, res) {
    let function_name = getTopSellers.name;
    Logging.handleResponse(res, 200, top_sellers_games, function_name, "Got top selling games");
}

exports.getFeatured = getFeatured;
exports.getTopSellers = getTopSellers;