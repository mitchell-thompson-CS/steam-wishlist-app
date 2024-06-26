const { default: axios } = require('axios');
const schedule = require('node-schedule');
const { Logging, LogLevels } = require('./logging.js');
const { getGameData, steamClient, getGamesData } = require('./game');
require('dotenv').config({ path: __dirname + '/../../.env' });


let featured = [];
let top_sellers = [];
const country = 'US';
const language = 'en';
const CHECK_CHANGES_DELAY = 10 * 1000; // 10 seconds

async function getSteamStore() {
    let function_name = getSteamStore.name;
    try {
        let featured_res = await axios.get('https://store.steampowered.com/api/featured/');
        let data = featured_res.data;
        if (!data || !data['featured_win']) {
            Logging.log(function_name, "Error getting featured games", LogLevels.ERROR);
            return;
        }
        let temp = [];
        for (let game of Object.keys(data['featured_win'])) {
            temp.push(data['featured_win'][game]['id']);
        }
        featured = temp;
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
        let data = res.data.response.ranks;
        let temp = [];
        for (let key of Object.keys(data)) {
            temp.push(data[key]['appid']);
        }
        top_sellers = temp;
    } catch (error) {
        Logging.log(function_name, "Error getting data for top sellers: " + error, LogLevels.ERROR);
    }

}

schedule.scheduleJob('0 5 10 * * *', setupHomeInfo);
// run once on startup
steamClient.on('loggedOn', setupHomeInfo);

async function setupHomeInfo() {
    await getSteamStore();
    await getSteamTopSellers();

    getGamesData(featured);
    getGamesData(top_sellers);
}

async function getFeatured(req, res) {
    let function_name = getFeatured.name;
    let featured_games = await getGamesData(featured);
    Logging.handleResponse(res, 200, featured_games, function_name, "Got featured games");
}

async function getTopSellers(req, res) {
    let function_name = getTopSellers.name;
    let top_sellers_games = await getGamesData(top_sellers);
    // need to convert this output into an array so they stay in order
    let list = [];
    try {
        for (let id of top_sellers) {
            top_sellers_games[id]['appid'] = id;
            list.push(top_sellers_games[id]);
        }
    } catch (e) {
        Logging.log(function_name, "Error converting top sellers to list: " + top_sellers, LogLevels.ERROR);
    }
    Logging.handleResponse(res, 200, list, function_name, "Got top selling games");
}

exports.getFeatured = getFeatured;
exports.getTopSellers = getTopSellers;