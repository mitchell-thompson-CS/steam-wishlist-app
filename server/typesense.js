const Typesense = require('typesense');
const http = require('http');
var typesenseClient = new Typesense.Client({
    'nodes': [{
        'host': 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
        'port': 8108,      // For Typesense Cloud use 443
        'protocol': 'http'   // For Typesense Cloud use https
    }],
    'apiKey': `${process.env.TYPESENSE_API_KEY}`,
    'connectionTimeoutSeconds': 2
});

let gameSchema = {
    'name': 'games',
    'fields': [
        { 'name': 'name', 'type': 'string' },
        { 'name': 'appid', 'type': 'int32' },
    ]
}

typesenseClient.collections().retrieve().then(function (data) { return data.find(({ name }) => name === 'games') }).then(function (data) {
    // console.log(data)
    // TODO: maybe launch options here?
    if (data) {
        console.log("deleting and then readding")
        typesenseClient.collections('games').delete().then(function (data) {
            typesenseClient.collections().create(gameSchema).then(function (data) {
                console.log("Created Typesense collection");
                initializeTypesense();
            });
        });
    } else {
        typesenseClient.collections().create(gameSchema).then(function (data) {
            console.log("Created Typesense collection");
            initializeTypesense();
        });
    }
});

function initializeTypesense() {
    let data = "";
    let urlToPrint = "http://api.steampowered.com/ISteamApps/GetAppList/v2/";

    const request = http.get(urlToPrint, function (response) {

        response
            .on("data", append => data += append)
            .on("error", e => console.log(e))
            .on("end", () => { setupTypeSense(data) });

    });
}

// TODO: add weights to each app????? probably in a new collection that just stores {appid: weight}
// might only add to that collection when something gets clicked on for the first time rather than on startup
async function setupTypeSense(data) {
    console.log("Setting up Typesense");
    let fixedList = JSON.parse(data).applist.apps;
    // for (key in fixedList) {
    //   typesenseClient.collections('games').documents().upsert(fixedList[key]);
    // }
    await typesenseClient.collections('games').documents().import(fixedList, { action: 'upsert' });
    console.log("Finished setting up Typesense")

    // typesenseClient.collections('games').documents().search(searchParameters).then(function (data) {
    //   console.log(data);
    // });
}

async function searchForGame(gameName, numPerPage) {
    let searchParameters = {
        'q': gameName,
        'query_by': 'name',
        'per_page': numPerPage,
    };
    return typesenseClient.collections().retrieve().then(function (data) { return data.find(({ name }) => name === 'games') }).then(function (data) {
        if (data) {
            return typesenseClient.collections('games').documents().search(searchParameters).then(function (data) {
                return data;
            });
        }
    });
}

exports.searchForGame = searchForGame;
exports.typesenseClient = typesenseClient;