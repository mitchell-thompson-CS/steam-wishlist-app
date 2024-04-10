const { default: axios } = require('axios');
const schedule = require('node-schedule');
const { Logging, LogLevels } = require('./logging.js');
const { getGameData, steamClient } = require('./game');
require('dotenv').config({ path: __dirname + '/../../.env' });


let featured = null;
let featured_games = {};
let top_sellers = null;
let top_sellers_games = [];
const country = 'US';
const language = 'en';
const CHECK_CHANGES_DELAY = 10 * 1000; // 10 seconds

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
            try {
                let game_data = await getGameData(game['id']);
                featured_games[game['id']] = game_data;
            } catch (e) {
                Logging.log(function_name, "Error getting game " + game['id'], LogLevels.WARN);
            }
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
            try {
                let game_data = await getGameData(game['appid']);
                game_data.appid = game['appid'];
                top_sellers_games.push(game_data);
            } catch (e) {
                Logging.log(function_name, "Error getting game " + game['appid'], LogLevels.WARN);
            }
        }
    } catch (error) {
        Logging.log(function_name, "Error getting data for top sellers: " + error, LogLevels.ERROR);
    }

}

schedule.scheduleJob('0 5 10 * * *', setupHomeInfo);
// run once on startup
steamClient.on('loggedOn', setupHomeInfo);

function setupHomeInfo() {
    let function_name = setupHomeInfo.name;
    let featured = getSteamStore();
    let top = getSteamTopSellers();
    Promise.all([featured, top]).then(() => {
        let timer = setInterval(() => {
            verifyHome();
        }, CHECK_CHANGES_DELAY);

        function verifyHome() {
            Logging.log(function_name, "Checking if featured and top sellers have been successfully acquired");
            for(let key of Object.keys(featured_games)) {
                let game = featured_games[key];
                if(game.cache === false) {
                    Logging.log(function_name, "Incomplete game " + key + " found in featured games. Reattempting fetch...");
                    getSteamStore();
                    getSteamTopSellers();
                    return;
                }
            }

            for(let key of Object.keys(top_sellers_games)) {
                let game = top_sellers_games[key];
                if(game.cache === false) {
                    Logging.log(function_name, "Incomplete game " + key + " found in top sellers. Reattempting fetch...");
                    getSteamStore();
                    getSteamTopSellers();
                    return;
                }
            }

            Logging.log(function_name, "Featured and top sellers up to date. Clearing timer...")
            clearInterval(timer);
        }

        verifyHome();
    })
}

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