const { default: axios } = require('axios');
const { Logging, LogLevels } = require('./logging.js');
const { searchForGame } = require('./typesense.js');
require('dotenv').config({ path: __dirname + '/../../.env' });
const async = require('async')

const HEADER_BASE_URL = 'https://cdn.akamai.steamstatic.com/steam/apps/';
const QUEUE_RATE = 25;
const EXPIRY_TIME = 1000 * 60 * 60 * 24; // 24 hours
const PLAYER_EXPIRY_TIME = 1000 * 60 * 60; // 1 hour
const RATE_LIMIT_WAIT = 1000 * 60; // 1 minute

const SteamUser = require('steam-user');
let client = new SteamUser();
let steamConnected = false;
client.setOptions({
    enablePicsCache: true,
})
client.logOn({ anonymous: true });

client.on('loggedOn', async (details) => {
    Logging.log("SteamUser", "Logged into Steam as " + client.steamID.getSteam3RenderedID());
    steamConnected = true;
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
});

client.on('appUpdate', async (appid, data) => {
    // updated other cache information whenever app updates
    addToQueue(appid);
})

let cachedData = {};
let inQueue = {};

async function addToQueue(appid, onlyPlayerCount = false) {
    if (inQueue[appid] === undefined || (inQueue[appid] === true && onlyPlayerCount === false)) {
        inQueue[appid] = onlyPlayerCount;
        setCacheUpdating(appid);
        Logging.log("addToQueue", "App " + appid + " added to queue");
        appQueue.push({ appid: appid, onlyPlayerCount: onlyPlayerCount }, () => {
            Logging.log("addToQueue", "App " + appid + " finished queue");
        });
    }
}

function setCacheUpdating(appid) {
    if(cachedData[appid]) {
        cachedData[appid].updatingCache = true;
    }
}

// TODO: allow player count to update separately
const appQueue = async.queue(async (input_data) => {
    let appid = input_data.appid;
    let onlyPlayerCount = input_data.onlyPlayerCount;
    let currency = 'USD';
    let function_name = "AppQueue"
    if (cachedData[appid] && onlyPlayerCount) {
        try {
            let appplayercount_res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + appid + '&key=' + process.env.STEAM_API_KEY);
            let appplayercount = appplayercount_res.data.response;

            // only update if we got information
            if (appplayercount && appplayercount.result === 1) {
                cachedData[appid].playingnow = appplayercount;
            }

            // reset expired time
            cachedData[appid].playerExpiryDate = Date.now() + PLAYER_EXPIRY_TIME;
            cachedData[appid].updatingCache = false;
            Logging.log(function_name, "Updated player count information for " + appid);
        } catch (e) {
            Logging.log(function_name, "Error getting player count for app " + appid);
        }

        try {
            delete inQueue[appid];
        } catch (e) {
            Logging.log(function_name, "Error deleting from inQueue", LogLevels.WARN);
        }
        return;
    }

    try {
        let appdetails_res = await axios.get('https://store.steampowered.com/api/appdetails?currency=' + currency + '&appids=' + appid);
        let appdetails = appdetails_res.data;
        let appplayercount;
        try {
            let appplayercount_res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + appid + '&key=' + process.env.STEAM_API_KEY);
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

        if (appdetails && appdetails[appid] && appdetails[appid]['data']) {
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

            let entry = appdetails[appid]['data'];

            entry['price_overview'] = {
                ...entry['price_overview'],
                is_free: entry.is_free
            };

            let gameData = {
                'short_description': entry['short_description'],
                'pc_requirements': entry['pc_requirements'],
                'mac_requirements': entry['mac_requirements'],
                'linux_requirements': entry['linux_requirements'],
                'developers': entry['developers'],
                'publishers': entry['publishers'],
                'price_overview': entry['price_overview'],
                'genres': entry['genres'],
                'playingnow': entry['playingnow'],
                'release_date': entry['release_date'],
                'expiryDate': Date.now() + EXPIRY_TIME, // currently unused. instead using steamclient's on appUpdate hook to update stale data
                'playerExpiryDate': Date.now() + PLAYER_EXPIRY_TIME,
                'createdDate': Date.now(),
                'updatingCache': false,
            }

            cachedData[appid] = gameData;
        } else if (appdetails && appdetails[appid] && appdetails[appid]['success'] === false) {
            // when whatever app it is couldn't be grabbed from steam (error on their side, meaning app likely doesn't exist as a proper app)
            cachedData[appid] = {updatingCache: false};
        }
    } catch (e) {
        Logging.log(function_name, "Error getting app " + appid + ": " + e, LogLevels.WARN);
        // rate limit error
        if (e.response.status === 429) {
            setTimeout(() => {
                appQueue.resume();
            }, RATE_LIMIT_WAIT);
            appQueue.push({ appid: appid, onlyPlayerCount: onlyPlayerCount }, () => {
                Logging.log("addToQueue", "App " + appid + " finished queue");
            });
            appQueue.pause();
            // return to stop from deleting the appid from the inQueue object
            return;
        }
    }

    try {
        delete inQueue[appid];
    } catch (e) {
        Logging.log(function_name, "Failed to delete from InQueue: " + e, LogLevels.WARN);
    }
}, QUEUE_RATE);

/** Gets data for a game from the Steam API and returns JSON object of it if it exists.
 *  Returns null if the game does not exist.
 * 
 * @param {any} appid 
 * @returns 
 */
async function getGameData(appid) {
    let function_name = getGameData.name;
    if (!steamConnected) {
        return null;
    }

    try {
        let verifyApp = verifyAppID(appid);
        if (!verifyApp) {
            Logging.log(function_name, "Invalid app id " + appid);
            return null;
        }
        appid = verifyApp;

        let appinfo = (await handleAppInfo([appid]))[appid];

        if (!appinfo) {
            return null;
        }

        return (await handleGameData(appid, appinfo));
    } catch (e) {
        Logging.log(function_name, "Error getting gameData for app " + appid + ": " + e, LogLevels.WARN)
        return null;
    }
}

/** Gets the game data for multiple appids.
 * 
 * @param {any[]} appids 
 * @returns 
 */
async function getGamesData(appids) {
    let function_name = getGamesData.name;
    if (!steamConnected) {
        return {};
    }

    try {
        let valid_ids = [];
        for (let appid of appids) {
            let id_verify = verifyAppID(appid);
            if (id_verify !== false) {
                valid_ids.push(id_verify);
            }
        }

        let appsinfo = (await handleAppInfo(valid_ids));

        let result = {};
        for (let appid of valid_ids) {
            result[appid] = (handleGameData(appid, appsinfo[appid]));
        }
        // waits for all the results to be completed and then creates new map with them resolved
        result = await Promise.all(Object.entries(result).map(async ([k,v]) => [k, await v])).then(Object.fromEntries);
        return result;
    } catch (e) {
        Logging.log(function_name, "Error getting gameData for apps " + appids + ": " + e, LogLevels.WARN)
        return {};
    }
}

/** Verifies if any input is a valid appid (aka a number).
 * 
 * @param {*} appid 
 * @returns
 */
function verifyAppID(appid) {
    if (!Number(appid)) {
        return false;
    }

    return Number(appid);
}

/** Gets the app info from the steam client cache or fetches it.
 * 
 * @param {number[]} appids 
 */
async function handleAppInfo(appids) {
    let function_name = handleAppInfo.name;
    let result = {};
    let not_cached = [];
    for (let appid of appids) {
        let appinfo = client.picsCache.apps[appid];
        if (appinfo) {
            appinfo = appinfo.appinfo;
            result[appid] = appinfo;
        } else {
            not_cached.push(appid);
        }
    }

    if (not_cached.length > 0) {
        Logging.log(function_name, "App(s) " + not_cached + " not found in cache. Fetching...");
        let appinfos = await client.getProductInfo(not_cached, [], true);
        if (appinfos.apps) {
            for (let key of Object.keys(appinfos.apps)) {
                if (appinfos.apps[key] && appinfos.apps[key].appinfo) {
                    result[key] = appinfos.apps[key].appinfo;
                }
            }
        }
    }
    return result;
}

/** Correctly formats app info from the caches into an output object.
 * 
 * @param {number} appid 
 * @param {{}} appinfo 
 * @returns 
 */
async function handleGameData(appid, appinfo) {
    let function_name = handleGameData.name;
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
            if (appinfo && appinfo.common && appinfo.common.store_tags) {
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
            }
        } catch (e) {
            Logging.log(function_name, "Error getting tags for app " + appid, LogLevels.WARN);
        }
        return result;
    }

    if (!cachedData[appid]) {
        addToQueue(appid);
    } else if (cachedData[appid].playerExpiryDate < Date.now()) {
        addToQueue(appid, true);
    }

    
    let cacheState = cachedData[appid] && cachedData[appid].updatingCache === false ? true : false;

    // TODO: does bug with prices still exist????? ^^ above might fix it
    // console.log(appid, !!cachedData[appid], cachedData[appid]?cachedData[appid].updatingCache:null, cachedData[appid]?cachedData[appid].price_overview:null, cacheState);

    let gameData = {
        'type': appinfo.common.type,
        'name': appinfo.common.name,
        'dlc': appinfo.extended && appinfo.extended.listofdlc ? appinfo.extended.listofdlc.split(/[,]+/) : [],
        'short_description': cachedData[appid] ? cachedData[appid].short_description : undefined,
        'header_image': appinfo.common && appinfo.common.header_image && appinfo.common.header_image.english ?
            HEADER_BASE_URL + appid + '/' + appinfo.common.header_image.english : "",
        'website': appinfo.extended ? appinfo.extended.homepage : undefined,
        'pc_requirements': cachedData[appid] ? cachedData[appid].pc_requirements : undefined,
        'mac_requirements': cachedData[appid] ? cachedData[appid].mac_requirements : undefined,
        'linux_requirements': cachedData[appid] ? cachedData[appid].linux_requirements : undefined,
        'developers': appinfo.extended ? [appinfo.extended.developer] : [],
        'publishers': appinfo.extended ? [appinfo.extended.publisher] : [],
        'price_overview': cachedData[appid] ? cachedData[appid].price_overview : undefined,
        'platforms': getOSList(),
        'categories': await getCategoryList(),
        'genres': cachedData[appid] ? cachedData[appid].genres : undefined,
        'release_date': cachedData[appid] ? cachedData[appid].release_date : undefined,
        'playingnow': cachedData[appid] ? cachedData[appid].playingnow : undefined,
        'reviews': { review_percentage: appinfo.common ? appinfo.common.review_percentage : undefined },
        'cache': cacheState,
    }

    return gameData;
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

    let gameData = (await getGamesData(game_ids));

    Logging.handleResponse(res, 200, gameData, function_name, "Got game data for " + game_ids);

}

exports.getGamePage = getGamePage;
exports.searchGamePage = searchGamePage;
exports.getGameData = getGameData;
exports.getGamesData = getGamesData;
exports.getGamesPage = getGamesPage;
exports.steamClient = client;
exports.steamConnected = steamConnected;
exports.verifyAppID = verifyAppID;
exports.addToAppQueue = addToQueue;