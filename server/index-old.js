// import SteamUser from "steam-user";

// const client = new SteamUser();
// client.logOn({
//     anonymous: true
// });

// client.setOption("enablePicsCache", true);
// client.setOption("picsCacheAll", true);
// client.setOption("changelistUpdateInterval", 10000)

// client.on("packageUpdate", (packageName, packageVersion) => {
//     console.log(`Package ${packageName} updated to version ${JSON.stringify(packageVersion)}`);
// });

// client.on("appUpdate", (appId, data) => {
//     console.log(`App ${appId} updated: ${JSON.stringify(data)}`);
//     for (let pic in client.picsCache) {
//         console.log(pic)
//     }
// });

// import http from "http";
// import https from 'https';

// var options = {
//     host: 'api.isthereanydeal.com',
//     path: '/v01/deals/list/'
// }

// options.path = options.path + '?key=KEYHERE&offset=0&limit=10000&shops=steam'

// var req = https.get(options, function(res) {
//   console.log('STATUS: ' + res.statusCode);
//   console.log('HEADERS: ' + JSON.stringify(res.headers));
// //   Buffer the body entirely for processing as a whole.
//   var bodyChunks = [];
//   res.on('data', function(chunk) {
//     // You can process streamed parts here...
//     bodyChunks.push(chunk);
//   }).on('end', function() {
//     var body = Buffer.concat(bodyChunks);
//     // console.log('BODY: ' + body);
//     var test = '' + body
//     test = JSON.parse(test)
//     console.log(test.data.list)
//     // TODO: remove bundles from this (just a filter)
//     // TODO: figure out how to get the time numbers they do
//   })
// });

// req.on('error', function(e) {
//   console.log('ERROR: ' + e.message);
// });

