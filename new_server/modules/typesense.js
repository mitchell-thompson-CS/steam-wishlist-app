const Typesense = require('typesense');
const http = require('http');
const { Logging, LogLevels } = require('./logging');
const { default: axios } = require('axios');

const typesenseClient = new Typesense.Client({
    'nodes': [{
        'host': 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
        'port': 8108,      // For Typesense Cloud use 443
        'protocol': 'http'   // For Typesense Cloud use https
    }],
    'apiKey': `${process.env.TYPESENSE_API_KEY}`,
    'connectionTimeoutSeconds': 2
});

const gameSchema = {
    'name': 'games',
    'fields': [
        { 'name': 'name', 'type': 'string' },
        { 'name': 'appid', 'type': 'int32' },
    ]
}

/**
 * Makes sure that typesense is initialized properly for the server to use
 */
async function startTypesense() {
    let function_name = "start_typesense";
    let data = await typesenseClient.collections().retrieve().then(function (data) { return data.find(({ name }) => name === 'games') });
    try {
        if (data) {
            await clearTypesenseCollection("games");
            await initializeTypesenseCollection(gameSchema);
            await setupTypeSenseCollection("games", await getSteamData());
        } else {
            // await typesenseClient.collections().create(gameSchema);
            Logging.log(function_name, "Created Typesense collection");
            await initializeTypesenseCollection(gameSchema);
            await setupTypeSenseCollection("games", await getSteamData());
        }
    } catch (e) {
        Logging.log(function_name, e, LogLevels.ERROR);
    }
}

/**
 * Deletes the given collection name from Typesense
 * @param {String} collection - the name of the collection to clear
 */
async function clearTypesenseCollection(collection) {
    let function_name = "clearTypesense";
    Logging.log(function_name, "Deleting " + collection + " collection in Typesense");
    try {
        return await typesenseClient.collections(collection).delete();
    }
    catch (e) {
        Logging.log(function_name, e, LogLevels.ERROR);
    }
}

/**
 * Initializes a Typesense collection with the given schema
 * @param {String} collection - the name of the collection to initialize
 */
async function initializeTypesenseCollection(schema) {
    let function_name = "initializeTypesenseCollection";
    try {
        let res = await typesenseClient.collections().create(schema);
        Logging.log(function_name, "Created Typesense collection");
        return res;
    }
    catch (e) {
        Logging.log(function_name, e, LogLevels.ERROR);
    }
}

/**
 * Returns the app list from steam
 */
async function getSteamData() {
    let data = "";
    let urlToPrint = "http://api.steampowered.com/ISteamApps/GetAppList/v2/";

    try {
        return await axios.get(urlToPrint).then((response) => {
            return JSON.parse(JSON.stringify(response.data)).applist.apps;
        });
    }
    catch (e) {
        Logging.log("initializeTypesense", e, LogLevels.ERROR);
    }
}

// TODO: add weights to each app????? probably in a new collection that just stores {appid: weight}
// might only add to that collection when something gets clicked on for the first time rather than on startup
/**
 * Sets up the Typesense games collection with the app list from steam
 * @param {String} collection - the name of the collection to setup
 * @param {any} data - the app list to initialize with
 */
async function setupTypeSenseCollection(collection, data) {
    let function_name = "setupTypeSense";
    try {
        Logging.log(function_name, "Setting up Typesense for collection " + collection);
        let res = await typesenseClient.collections(collection).documents().import(data, { action: 'upsert' });
        Logging.log(function_name, "Finished setting up Typesense for collection " + collection);
        return res;
    } catch (e) {
        Logging.log(function_name, e, LogLevels.ERROR);
    }
}

/**
 * Searches the Typesense games collection for a game with the given name
 * @param {string} gameName - the name of the game to search for
 * @param {number} numPerPage - the number of results to return per page
 * @returns {any} - the results of the search
 */
async function searchForGame(gameName, numPerPage) {
    let searchParameters = {
        'q': gameName,
        'query_by': 'name',
        'per_page': numPerPage,
    };
    return await searchTypesenseCollection('games', searchParameters);
}

/**
 * Searches the given collection in Typesense with the given search parameters
 * @param {String} collection - the name of the collection to search
 * @param {any} searchParameters - the search parameters to use
 * @returns {any} - the results of the search
 */
async function searchTypesenseCollection(collection, searchParameters) {
    let function_name = "searchTypesenseCollection";
    return typesenseClient.collections(collection).documents().search(searchParameters).then(function (data) {
        return data;
    }).catch((e) => {
        Logging.log(function_name, e, LogLevels.ERROR);
        return {};
    })
}

/**
 * Checks if Typesense is healthy
 * @returns {boolean} - true if Typesense is healthy, false otherwise
 */
async function checkTypesenseHealth() {
    try {
        await typesenseClient.health.retrieve();
        return true;
    } catch (e) {
        return false;
    }
}

exports.searchForGame = searchForGame;
exports.startTypesense = startTypesense;
exports.searchTypesenseCollection = searchTypesenseCollection;

exports.exportedForTesting = {
    clearTypesenseCollection: clearTypesenseCollection,
    initializeTypesenseCollection: initializeTypesenseCollection,
    setupTypeSenseCollection: setupTypeSenseCollection,
    checkTypesenseHealth: checkTypesenseHealth,
    gameSchema: gameSchema,
    getSteamData: getSteamData
}