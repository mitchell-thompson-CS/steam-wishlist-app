const { searchForGame } = require('./typesense.js');

// TODO: restructure game data method with a SteamError or something similar
async function getGameData(appid) {
  let currency = 'USD';
  return await fetch('https://store.steampowered.com/api/appdetails?currency=' + currency + '&appids=' + appid)
  .then(response => response.json())
  .then(async (data) => {
    return await fetch('https://store.steampowered.com/appreviews/' + appid + '?json=1')
    .then(response => response.json())
    .then(reviewData => {
      // need to maKe sure that we actually got data (and its proper data) from both requests
      if (data && data[appid] && reviewData){
        if (reviewData['success'] && data[appid]['success']) {
          data[appid]['data']['reviews'] = reviewData['query_summary'];
        }
        return data;
      }
    })
  })
}

// TODO: do we need to handle errors from searchForGame?
async function searchGamePage(req, res){
  let query = req.params.query;
  // console.log("Searching for " + query);
  let gameList = await searchForGame(query, 5);
  res.send(gameList.hits);
  // console.log('sent game list');
}

// TODO: handle error from the note on getGameData
function getGamePage(req, res){
  console.log('searching for game id ' + req.params.game_id)
  getGameData(req.params.game_id).then((data) => {
    if (data[req.params.game_id]['success']) {
      let entry = data[req.params.game_id]['data'];
      // we want type, name, dlc, short_description, header_image, website, pc_requirements, mac_requirements, linux_requirements, developers, publishers, price_overview, platforms, categories, genres, release_date
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

      // console.log(gameData)
      // res.render('game', { gameData: gameData });
      res.send(gameData);
      // https://store.steampowered.com/appreviews/105600?json=1
    } else {
      res.sendStatus(404);
    }
  });
}

exports.getGamePage = getGamePage;
exports.searchGamePage = searchGamePage;
exports.getGameData = getGameData;