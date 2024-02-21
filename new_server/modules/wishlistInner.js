const { getDb } = require('./firebase')
const { Logging, LogLevels } = require('./logging')
const { getGameData } = require('./game')
const FieldValue = require('firebase-admin').firestore.FieldValue;


/** Renames a wishlist in the firestore database and sends a 200 status code if successful
 * @params request object with a wishlist_name and wishlist_id in the body
 * @params response object
 */
async function renameWishlist(req, res) {
    let function_name = renameWishlist.name;
    let post = JSON.parse(JSON.stringify(req.body));
    var wishlist_name = post['wishlist_name'];
    var wishlist_id = post['wishlist_id'];
    if (!wishlist_name || !wishlist_id) {
        // wishlist name is empty
        Logging.handleResponse(res, 400, null, function_name,
            "Wishlist name is empty in request by " + req.user.id);
        return;
    }

    Logging.log(function_name,
        "Attempting to rename wishlist " + wishlist_id + " by " + req.user.id);

    try {
        let wishlistSnapshot = await getDb().collection('wishlists').doc(wishlist_id).get()
        if (!wishlistSnapshot.exists) {
            // wishlist doesn't exist
            Logging.handleResponse(res, 404, null, function_name,
                "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
            return;
        }
        let data = wishlistSnapshot.data();
        if (data.owner.id != req.user.id) {
            // user is not the owner or editor
            Logging.handleResponse(res, 403, null, function_name,
                "User " + req.user.id + " is not the owner of wishlist " + wishlist_id);
            return;
        }
        await getDb().collection('wishlists').doc(wishlist_id).update({
            name: wishlist_name
        }).then(() => {
            Logging.handleResponse(res, 200, null, function_name,
                "Wishlist " + wishlist_id + " renamed to " + wishlist_name + " by user " + req.user.id);
            return;
        });
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error renaming wishlist " + wishlist_id + " by user " + req.user.id + ": " + error);
        return;
    }
}

/** Gets a wishlist from the firestore database and sends it to the client
 * @params request object that has a parameter with id
 * @params response object
 */
async function getWishlistInner(req, res) {
    let function_name = getWishlistInner.name;
    if (!req.params || !req.params.id) {
        Logging.handleResponse(res, 400, null, function_name,
            "Wishlist id is empty in request by " + req.user.id);
        return;
    }

    try {
        let wishlistSnapshot = await getDb().collection('wishlists').doc(req.params.id).get();
        if (!wishlistSnapshot.exists) {
            Logging.handleResponse(res, 404, null, function_name,
                "Wishlist " + req.params.id + " doesn't exist by " + req.user.id);
            return;
        }

        let data = wishlistSnapshot.data();
        data['id'] = req.params.id;
        if (!data.editors[req.user.id] && data.owner.id != req.user.id) {
            Logging.handleResponse(res, 403, null, function_name,
                "User " + req.user.id + " is not the owner or editor of wishlist " + req.params.id);
            return;
        }

        // change document references to ids
        if (data.owner) {
            data.owner = data.owner.id;
        }
        if (data.editors) {
            for (editor in data.editors) {
                data.editors[editor] = data.editors[editor].id;
            }
        }

        Logging.handleResponse(res, 200, data, function_name,
            "Sent wishlist " + req.params.id + " to user " + req.user.id);
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error getting wishlist " + req.params.id + " by user " + req.user.id + ": " + error);
    }
}

/** Adds a game to a wishlist in the firestore database and sends a 200 status code if successful
 * @params request object with a game_id and wishlist_id in the body
 * @params response object
 */
async function addGameToWishlist(req, res) {
    let function_name = addGameToWishlist.name;
    var post = JSON.parse(JSON.stringify(req.body));
    var game_id = post['game_id'];
    var wishlist_id = post['wishlist_id'];
    if (!game_id || !wishlist_id) {
        // no game id or wishlist id
        Logging.handleResponse(res, 400, null, function_name,
            "No game id or wishlist id given by user " + req.user.id);
        return;
    }

    try {
        let wishlistSnapshot = await getDb().collection('wishlists').doc(wishlist_id).get();
        if (!wishlistSnapshot.exists) {
            // wishlist doesn't exist
            Logging.handleResponse(res, 404, null, function_name,
                "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
            return;
        }
        var data = wishlistSnapshot.data();

        if (!data.editors[req.user.id] && data.owner.id != req.user.id) {
            // user is not the owner or editor
            Logging.handleResponse(res, 403, null, function_name,
                "User " + req.user.id + " is not the owner or editor of wishlist " + wishlist_id);
            return;
        }

        let gameData = await getGameData(game_id);

        // game doesn't exist
        if (!gameData || !gameData[game_id] || gameData[game_id]['success'] === false) {
            Logging.handleResponse(res, 404, null, function_name,
                "Game " + game_id + " doesn't exist");
            return;
        }

        await getDb().collection('wishlists').doc(wishlist_id).update({
            [`games.${game_id}`]: gameData[game_id]['data']['name']
        })

        Logging.handleResponse(res, 200, null, function_name,
            "Game " + game_id + " added to wishlist " + wishlist_id + " by user " + req.user.id);
        return;
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error adding game " + game_id + " to wishlist " + wishlist_id + " by user " + req.user.id + ": " + error);
        return;
    }
}

exports.renameWishlist = renameWishlist;
exports.getWishlistInner = getWishlistInner;
exports.addGameToWishlist = addGameToWishlist;