const Typesense = require('typesense');
const { Logging, LogLevels } = require('./logging');
const { default: axios } = require('axios');
require('dotenv').config({ path: __dirname + '/../../.env' });

let typesenseClient;

try {
    typesenseClient = new Typesense.Client({
        'nodes': [{
            'host': 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
            'port': `${process.env.TYPESENSE_PORT}`,      // For Typesense Cloud use 443
            'protocol': 'http'   // For Typesense Cloud use https
        }],
        'apiKey': `${process.env.TYPESENSE_API_KEY}`,
        'connectionTimeoutSeconds': 2
    });
} catch (e) {
    Logging.log("typesense", e, LogLevels.ERROR);
}

const gameSchema = {
    'name': 'games',
    'fields': [
        { 'name': 'name', 'type': 'string' },
        { 'name': 'id', 'type': 'int32' },
    ]
}

async function setTypesenseClient(client) {
    typesenseClient = client;
}

/**
 * Makes sure that typesense is initialized properly for the server to use
 * @param {boolean} reset - whether or not to reset the typesense collection
 * @param {string} collectionName - the name of the collection to use
 */
async function startTypesense(reset = false, collectionName = "games") {
    let function_name = "start_typesense";
    gameSchema.name = collectionName;
    try {
        let data = await typesenseClient.collections().retrieve().then(function (data) { return data.find(({ name }) => name === collectionName) });
        if (reset) {
            // since we are resetting, need to delete the collection and then reinitialize it and put data in it
            await clearTypesenseCollection(collectionName);
            await initializeTypesenseCollection(gameSchema);
            await setupTypeSenseCollection(collectionName, await getSteamData());
        }
        else if (data) {
            // update the collection with any new data from steam
            await setupTypeSenseCollection(collectionName, await getSteamData());
        }
        else {
            // need to create the collection, then can put steam data in it
            await initializeTypesenseCollection(gameSchema);
            await setupTypeSenseCollection(collectionName, await getSteamData());
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
 * @returns {any} - the result of the typesense collection creation
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
 * @returns {any} - the app list from steam
 */
async function getSteamData() {
    let data = "";
    let urlToPrint = "http://api.steampowered.com/ISteamApps/GetAppList/v2/";

    try {
        return await axios.get(urlToPrint).then((response) => {
            let newResponse = JSON.parse(JSON.stringify(response.data).replaceAll("\"appid\"", "\"id\"")).applist.apps;
            for (let i = 0; i < newResponse.length; i++) {
                newResponse[i].id = String(newResponse[i].id);
            }
            return newResponse;
        });
    }
    catch (e) {
        Logging.log("initializeTypesense", e, LogLevels.ERROR);
    }
}

// TODO: add weights to each app????? probably in a new collection that just stores {appid: weight}
// might only add to that collection when something gets clicked on for the first time rather than on startup
/**
 * Sets up the Typesense games collection with the app list
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
        console.log(e)
        Logging.log(function_name, e, LogLevels.ERROR);
    }
}

/**
 * Searches the Typesense games collection for a game with the given name
 * @param {string} gameName - the name of the game to search for
 * @param {number} numPerPage - the number of results to return per page
 * @param {string} collectionName - the name of the collection to search (default "games")
 * @returns {any} - the results of the search
 */
async function searchForGame(gameName, numPerPage, collectionName = "games") {
    let searchParameters = {
        'q': gameName,
        'query_by': 'name',
        'per_page': numPerPage,
    };
    return await searchTypesenseCollection(collectionName, searchParameters);
}

/**
 * Searches the given collection in Typesense with the given search parameters
 * @param {String} collection - the name of the collection to search
 * @param {any} searchParameters - the search parameters to use
 * @returns {any} - the results of the search
 */
async function searchTypesenseCollection(collection, searchParameters) {
    let function_name = "searchTypesenseCollection";
    Logging.log(function_name, "Searching for " + searchParameters.q + " in collection " + collection);
    return await typesenseClient.collections(collection).documents().search(searchParameters).then(function (data) {
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
    getSteamData: getSteamData,
    setTypesenseClient: setTypesenseClient,
}