const { default: axios } = require('axios');
const { Logging, LogLevels } = require('./logging.js');
const { searchForGame } = require('./typesense.js');
require('dotenv').config({ path: __dirname + '/../../.env' });

const HEADER_BASE_URL = 'https://cdn.akamai.steamstatic.com/steam/apps/';

const SteamUser = require('steam-user');
let client = new SteamUser();
let steamConnected = false;
client.setOptions({
    enablePicsCache: true,
})
client.logOn();

client.on('loggedOn', async (details) => {
    Logging.log("SteamUser", "Logged into Steam as " + client.steamID.getSteam3RenderedID());
    steamConnected = true;

    // let result = await client.getProductInfo([440, 730, 620], [], true);
    // console.log(result);
});

client.on('error', async (e) => {
    Logging.log("SteamUser", "ERROR:" + e, LogLevels.ERROR);
});

client.on('disconnected', async (e) => {
    Logging.log("SteamUser", "Steam disconnected", LogLevels.WARN);
    steamConnected = false;
});

client.on('debug', async (details) => {
    // console.log(details);
})

/** Gets data for a game from the Steam API and returns JSON object of it if it exists.
 *  Returns null if the game does not exist.
 * 
 * @param {any} appid 
 * @returns 
 */
async function getGameData(appid) {
    let function_name = getGameData.name;
    let currency = 'USD';
    if (!steamConnected) {
        return null;
    }

    try {
        console.log(appid);
        if (!Number(appid)) {
            console.log("not a number");
            return null;
        } else {
            appid = Number(appid);
        }
        let appinfo = client.picsCache.apps[appid];
        if (!appinfo) {
            Logging.log(function_name, "App " + appid + " not found in cache. Fetching...");
            appinfo = await client.getProductInfo([appid], [], false);
            if (!appinfo.apps[appid]) {
                // app doesn't exist
                Logging.log(function_name, "App " + appid + " doesn't exist.");
                return null;
            }
            appinfo = appinfo.apps[appid].appinfo;
        } else {
            appinfo = appinfo.appinfo;
        }
        // console.log(appinfo.extended);

        // console.log(await client.getAppRichPresenceLocalization(appid, "english"));
        function getOSList() {
            let result = { windows: false, mac: false, linux: false };
            if (appinfo.common.oslist) {
                let list = appinfo.common.oslist.split(/[,]+/);
                for (let item of list) {
                    switch (item) {
                        case "windows":
                            result.windows = true;
                            break;
                        case "macos":
                            result.mac = true;
                            break;
                        case "linux":
                            result.linux = true;
                            break;
                    }
                }
                return result;
            }

            return result;
        }

        async function getCategoryList() {
            let result = []
            try {
                let categories = appinfo.common.store_tags;
                let tags = (await client.getStoreTagNames("english", Object.values(categories))).tags;
                for (let key of Object.keys(tags)) {
                    let id = key;
                    let description = tags[key].name;
                    result.push({
                        id: id,
                        description: description
                    })
                }
            } catch (e) {
                Logging.log(function_name, "Error getting tags for app " + appid, LogLevels.WARN);
            }
            return result;
        }

        let gameData = {
            'type': appinfo.common.type,
            'name': appinfo.common.name,
            'dlc': appinfo.extended.listofdlc ? appinfo.extended.listofdlc.split(/[,]+/) : [],
            //             'short_description': entry['short_description'],
            'header_image': appinfo.common.header_image && appinfo.common.header_image.english ?
                HEADER_BASE_URL + appid + '/' + appinfo.common.header_image.english : "",
            'website': appinfo.extended.homepage,
            //             'pc_requirements': entry['pc_requirements'],
            //             'mac_requirements': entry['mac_requirements'],
            //             'linux_requirements': entry['linux_requirements'],
            'developers': [appinfo.extended.developer],
            'publishers': [appinfo.extended.publisher],
            //             'price_overview': entry['price_overview'],
            'platforms': getOSList(),
            'categories': await getCategoryList(),
            //             'genres': entry['genres'],
            //             'release_date': entry['release_date'],
            //             'reviews': entry['reviews'],
            //             'playingnow': entry['playingnow']
        }
        console.log(gameData);
        return gameData;
    } catch (e) {
        console.log("ERROR");
        console.log(e);
        return null;
    }

    try {
        let appdetails_res = await axios.get('https://store.steampowered.com/api/appdetails?currency=' + currency + '&appids=' + appid);
        let appdetails = appdetails_res.data;
        let appreviews;
        try {
            let appreviews_res = await axios.get('https://store.steampowered.com/appreviews/' + appid + '?json=1');
            appreviews = appreviews_res.data;
        } catch (e) {
            Logging.log(function_name, "Error getting reviews for app " + appid);
        }

        let appplayercount;
        try {
            let appplayercount_res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + appid);
            appplayercount = appplayercount_res.data.response;
        } catch (e) {
            Logging.log(function_name, "Error getting player count for app " + appid);
        }
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

        if (appdetails && appdetails[appid] && appdetails[appid]['data']) {
            if (appreviews && appreviews['success'] && appdetails[appid]['success']) {
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