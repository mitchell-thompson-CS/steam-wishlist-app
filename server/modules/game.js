const { default: axios } = require('axios');
const { Logging, LogLevels } = require('./logging.js');
const { searchForGame } = require('./typesense.js');
require('dotenv').config({ path: __dirname + '/../../.env' });

/** Gets data for a game from the Steam API and returns JSON object of it if it exists.
 *  Returns null if the game does not exist.
 * 
 * @param {any} appid 
 * @returns 
 */
async function getGameData(appid) {
    let function_name = getGameData.name;
    let currency = 'USD';
    try {
        let appdetails_res = await axios.get('https://store.steampowered.com/api/appdetails?currency=' + currency + '&appids=' + appid);
        let appdetails = appdetails_res.data;
        let appreviews_res = await axios.get('https://store.steampowered.com/appreviews/' + appid + '?json=1');
        let appreviews = appreviews_res.data;
        let appplayercount_res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + appid);
        let appplayercount = appplayercount_res.data.response;
        let appstorelow;
        try {
            if (process.env.NODE_ENV !== "test") {
                let appdealid_res = await axios.get('https://api.isthereanydeal.com/games/lookup/v1?key=' + process.env.ANY_DEAL_API_KEY + "&appid=" + appid);
                const gameIds = [
                    appdealid_res.data.game.id
                ];
                let appstorelow_res = await axios.post('https://api.isthereanydeal.com/games/storelow/v2?key=' + process.env.ANY_DEAL_API_KEY + "&shops=61", gameIds);
                appstorelow = appstorelow_res.data[0].lows[0].price.amount;
            }
        } catch (e) {
            Logging.log(function_name, "Unable to get lows for game " + appid, LogLevels.WARN);
        }

        if (appstorelow) {
            appdetails[appid]['data']['price_overview'] = {
                ...appdetails[appid]['data']['price_overview'],
                lowestprice: appstorelow
            };
        }

        if (appplayercount && appplayercount.result === 1) {
            appdetails[appid]['data']['playingnow'] = appplayercount;
        } else {
            appdetails[appid]['data']['playingnow'] = -1;
        }

        if (appdetails && appdetails[appid] && appdetails[appid]['data'] && appreviews) {
            if (appreviews['success'] && appdetails[appid]['success']) {
                appdetails[appid]['data']['reviews'] = appreviews['query_summary'];
            }

            let entry = appdetails[appid]['data'];

            let gameData = {
                'type': entry['type'],
                'name': entry['name'],
                'dlc': entry['dlc'],
                'short_description': entry['short_description'],
                'header_image': entry['header_image'],
                'website': entry['website'],
                'pc_requirements': entry['pc_requirements'],
                'mac_requirements': entry['mac_requirements'],
                'linux_requirements': entry['linux_requirements'],
                'developers': entry['developers'],
                'publishers': entry['publishers'],
                'price_overview': entry['price_overview'],
                'platforms': entry['platforms'],
                'categories': entry['categories'],
                'genres': entry['genres'],
                'release_date': entry['release_date'],
                'reviews': entry['reviews'],
                'playingnow': entry['playingnow']
            }

            return gameData;
        } else {
            // game does not exist
            return null;
        }
    } catch (error) {
        Logging.log(function_name, "Error getting data for game " + appid + ": " + error, LogLevels.ERROR);
        return null;
    }
}

/** Searches for a game and sends the top 5 results.
 * 
 * @param {Request} req
 * @param {Response} res
 */
async function searchGamePage(req, res) {
    if (!req || !req.params || !req.params.query) {
        Logging.handleResponse(res, 400, null, "searchGamePage", "No query provided");
        return;
    }

    let query = req.params.query;
    let gameList = await searchForGame(query, 5);
    Logging.handleResponse(res, 200, gameList.hits, "searchGamePage", "Searched for game " + query);
}

/** Gets the game data for a game and sends it to the client.
 * 
 * @param {Request} req
 * @param {Response} res
 */
async function getGamePage(req, res) {
    if (!req || !req.params || !req.params.game_id) {
        Logging.handleResponse(res, 400, {}, "getGamePage", "Invalid request", LogLevels.ERROR);
        return;
    }

    let data = await getGameData(req.params.game_id);
    if (data) {
        // res.send(gameData);
        Logging.handleResponse(res, 200, data, "getGamePage", "Got game data for " + req.params.game_id);
    } else {
        // failure to get data
        Logging.handleResponse(res, 404, null, "getGamePage", "Game " + req.params.game_id + " does not exist", LogLevels.ERROR);
    }
}

/** Gets the game data for multiple games and sends it to the client.
 * 
 * @param {Request} req
 * @param {Response} res
 */
async function getGamesPage(req, res) {
    let function_name = getGamesPage.name;
    if (!req || !req.params || !req.params.game_ids) {
        Logging.handleResponse(res, 400, {}, function_name, "Invalid request");
        return;
    }
    let game_ids;
    try {
        game_ids = JSON.parse(req.params.game_ids);
    } catch (e) {
        Logging.handleResponse(res, 400, {}, function_name, "Invalid request");
        return;
    }

    if (!game_ids || game_ids.length === 0 || Array.isArray(game_ids) === false) {
        Logging.handleResponse(res, 400, {}, function_name, "Invalid request");
        return;
    }

    let gameData = {};
    for (let i = 0; i < game_ids.length; i++) {
        let data = await getGameData(game_ids[i]);
        if (data) {
            gameData[game_ids[i]] = data;
        } else {
            // make log note that game does not exist, but continue for the rest of the ids
            Logging.log(LogLevels.WARN, function_name, "Game " + game_ids[i] + " does not exist");
        }
    }

    Logging.handleResponse(res, 200, gameData, function_name, "Got game data for " + game_ids);

}

exports.getGamePage = getGamePage;
exports.searchGamePage = searchGamePage;
exports.getGameData = getGameData;
exports.getGamesPage = getGamesPage;