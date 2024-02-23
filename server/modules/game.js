const { default: axios } = require('axios');
const { Logging, LogLevels } = require('./logging.js');
const { searchForGame } = require('./typesense.js');

// TODO: restructure game data method with a SteamError or something similar
/** Gets data for a game from the Steam API and returns JSON object of it if it exists.
 *  Returns null if the game does not exist.
 * 
 * @param {any} appid 
 * @returns 
 */
async function getGameData(appid) {
    let currency = 'USD';
    try {
        let appdetails_res = await axios.get('https://store.steampowered.com/api/appdetails?currency=' + currency + '&appids=' + appid);
        let appdetails = appdetails_res.data;
        let appreviews_res = await axios.get('https://store.steampowered.com/appreviews/' + appid + '?json=1');
        let appreviews = appreviews_res.data;

        if (appdetails && appdetails[appid] && appreviews) {
            if (appreviews['success'] && appdetails[appid]['success']) {
                appdetails[appid]['data']['reviews'] = appreviews['query_summary'];
            }
            return appdetails;
        }
    } catch (error) {
        Logging.log(LogLevels.ERROR, "getGameData", "Error getting data for game " + appid + ": " + error);
        return null;
    }
}

// TODO: do we need to handle errors from searchForGame?
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

// TODO: handle error from the note on getGameData
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
    if (data && data[req.params.game_id] && data[req.params.game_id]['success']) {
        let entry = data[req.params.game_id]['data'];
        // we want type, name, dlc, short_description, header_image, website, pc_requirements, mac_requirements, 
        // linux_requirements, developers, publishers, price_overview, platforms, categories, genres, release_date
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
            'reviews': entry['reviews']
        }

        // res.send(gameData);
        Logging.handleResponse(res, 200, gameData, "getGamePage", "Got game data for " + req.params.game_id);
    } else {
        // failure to get data
        Logging.handleResponse(res, 404, null, "getGamePage", "Game " + req.params.game_id + " does not exist", LogLevels.ERROR);
    }
}

exports.getGamePage = getGamePage;
exports.searchGamePage = searchGamePage;
exports.getGameData = getGameData;