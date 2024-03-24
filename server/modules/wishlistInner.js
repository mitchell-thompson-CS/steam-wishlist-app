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
async function addGameToWishlists(req, res) {
    let function_name = addGameToWishlists.name;
    var post = JSON.parse(JSON.stringify(req.body));
    var game_id = post['game_id'];
    var wishlists = post['wishlists'];
    if (!game_id || !wishlists || wishlists.length === 0) {
        // no game id or wishlist id
        Logging.handleResponse(res, 400, null, function_name,
            "No game id or wishlists given by user " + req.user.id);
        return;
    }

    let cur_wishlist = null;

    try {
        let gameData = await getGameData(game_id);
        // game doesn't exist
        if (!gameData) {
            Logging.handleResponse(res, 404, null, function_name,
                "Game " + game_id + " doesn't exist");
            return;
        }

        for (let wishlist_id of wishlists) {
            cur_wishlist = wishlist_id;
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

            await getDb().collection('wishlists').doc(wishlist_id).update({
                [`games.${game_id}`]: gameData['name']
            })
        }

        Logging.handleResponse(res, 200, null, function_name,
            "Game " + game_id + " added to wishlist " + wishlists + " by user " + req.user.id);
        return;
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error adding game " + game_id + " to wishlist " + cur_wishlist + " by user " + req.user.id + ": " + error);
        return;
    }
}

/** Removes a game from a wishlist in the firestore database and sends a 200 status code if successful
 * @params request object with a game_id and wishlist_id in the body
 * @params response object
 */
async function removeGameFromWishlists(req, res) {
    let function_name = removeGameFromWishlists.name;
    var post = JSON.parse(JSON.stringify(req.body));
    var game_id = post['game_id'];
    var wishlists = post['wishlists'];
    // TODO: add sanitization to the ids like this one that are inputted by user
    if (!game_id || !wishlists || wishlists.length === 0) {
        // no game id or wishlist id
        Logging.handleResponse(res, 400, null, function_name,
            "No game id or wishlist id given by user " + req.user.id);
        return;
    }

    try {
        for (let wishlist_id of wishlists) {
            let wishlistSnapshot = await getDb().collection('wishlists').doc(wishlist_id).get()
            if (!wishlistSnapshot.exists) {
                // wishlist doesn't exist
                Logging.handleResponse(res, 404, null, function_name,
                    "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
                return;
            }
            var data = wishlistSnapshot.data();

            // user is not the owner or editor
            if (!data.editors[req.user.id] && data.owner.id != req.user.id) {
                Logging.handleResponse(res, 403, null, function_name,
                    "User " + req.user.id + " is not the owner or editor of wishlist " + wishlist_id);
                return;
            }

            // game doesn't exist in the wishlist on firestore
            if (!data.games[game_id]) {
                // game doesn't exist
                Logging.handleResponse(res, 404, null, function_name,
                    "Game " + game_id + " doesn't exist in wishlist " + wishlist_id);
                return;
            }

            await getDb().collection('wishlists').doc(wishlist_id).update({
                [`games.${game_id}`]: FieldValue.delete()
            });
        }

        Logging.handleResponse(res, 200, null, function_name,
            "Game " + game_id + " removed from wishlist " + wishlists + " by user " + req.user.id);
        return;
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error removing game " + game_id + " from wishlist " + wishlist_id + " by user " + req.user.id + ": " + error);
        return;
    }
}

/** Adds an editor to a wishlist in the firestore database and sends a 200 status code if successful
 * @params request object with a editor_id and wishlist_id in the body
 * @params response object
 */
async function addEditorToWishlist(req, res) {
    let function_name = addEditorToWishlist.name;
    var post = JSON.parse(JSON.stringify(req.body));
    var wishlist_id = post['wishlist_id'];
    var editor_id = post['editor_id'];
    if (!wishlist_id || !editor_id) {
        // no wishlist id or editor id
        Logging.handleResponse(res, 400, null, function_name,
            "No wishlist id or editor id by user " + req.user.id);
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

        if (data.owner.id != req.user.id) {
            // user is not the owner
            Logging.handleResponse(res, 403, null, function_name,
                "User " + req.user.id + " is not the owner of wishlist " + wishlist_id);
            return;
        } else if (data.editors[editor_id]) {
            // editor already exists
            Logging.handleResponse(res, 200, null, function_name,
                "Editor " + editor_id + " already exists in wishlist " + wishlist_id + " by user " + req.user.id);
            return;
        } else if (data.owner.id == editor_id) {
            // can't add owner as editor
            Logging.handleResponse(res, 400, null, function_name,
                "User " + editor_id + " is the owner of wishlist " + wishlist_id);
            return;
        } else if (!(await getDb().collection('users').doc(editor_id).get()).exists) {
            // editor doesn't exist
            Logging.handleResponse(res, 404, null, function_name,
                "User " + editor_id + " doesn't exist");
            return;
        }

        try {
            await getDb().collection('users').doc(editor_id).update({
                [`shared_wishlists.${wishlist_id}`]: getDb().collection('wishlists').doc(wishlist_id)
            })
            try {
                await getDb().collection('wishlists').doc(wishlist_id).update({
                    [`editors.${editor_id}`]: getDb().collection('users').doc(editor_id)
                })
                Logging.handleResponse(res, 200, null, function_name,
                    "Editor " + editor_id + " added to wishlist " + wishlist_id + " by user " + req.user.id);
            } catch (error) {
                // issue with adding shared wishlist to editor
                Logging.handleResponse(res, 500, null, function_name,
                    "Error adding shared wishlist " + wishlist_id + " to editor " + editor_id + " by user " + req.user.id + ": " + error);

                // have to attempt to remove the wishlist from the editor
                try {
                    await getDb().collection('users').doc(editor_id).update({
                        [`shared_wishlists.${wishlist_id}`]: FieldValue.delete()
                    });
                } catch (error2) {
                    // issue with removing editor from the wishlist
                    Logging.log(function_name,
                        "Unable to remove editor " + editor_id + " from wishlist " + wishlist_id, LogLevels.WARN);
                }
            }
        } catch (error) {
            Logging.handleResponse(res, 500, null, function_name,
                "Error adding editor " + editor_id + " to wishlist database " + wishlist_id + " by user " + req.user.id + ": " + error);
        }
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error adding editor " + editor_id + " to wishlist " + wishlist_id + " by user " + req.user.id + ": " + error);
    }
}

/** Deletes an editor from a wishlist in the firestore database and sends a 200 status code if successful
 * @params request object with a editor_id and wishlist_id in the body
 * @params response object
 */
async function deleteEditorFromWishlist(req, res) {
    let function_name = deleteEditorFromWishlist.name;
    var post = JSON.parse(JSON.stringify(req.body));
    var wishlist_id = post['wishlist_id'];
    var editor_id = post['editor_id'];
    if (!wishlist_id || !editor_id) {
        // no wishlist id or editor id
        Logging.handleResponse(res, 400, null, function_name,
            "No wishlist id or editor id by user " + req.user.id);
        return;
    }
    try {
        let wishlistSnapshot = await getDb().collection('wishlists').doc(wishlist_id).get()
        if (!wishlistSnapshot.exists) {
            // wishlist doesn't exist
            Logging.handleResponse(res, 404, null, function_name,
                "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
            return;
        }
        var data = wishlistSnapshot.data();
        if (data.owner.id != req.user.id) {
            // user is not the owner
            Logging.handleResponse(res, 403, null, function_name,
                "User " + req.user.id + " is not the owner of wishlist " + wishlist_id + " by user " + req.user.id);
            return;
        } else if (!data.editors[editor_id]) {
            // editor does not exist
            Logging.handleResponse(res, 200, null, function_name,
                "Editor " + editor_id + " does not exist in wishlist " + wishlist_id + " by user " + req.user.id);
            return;
        }
        try {
            await getDb().collection('users').doc(editor_id).update({
                [`shared_wishlists.${wishlist_id}`]: FieldValue.delete()
            })
            try {
                await getDb().collection('wishlists').doc(wishlist_id).update({
                    [`editors.${editor_id}`]: FieldValue.delete()
                })
                Logging.handleResponse(res, 200, null, "deleteEditorFromWishlist",
                    "Editor " + editor_id + " deleted from wishlist " + wishlist_id + " by user " + req.user.id);
            } catch (error) {
                // issue with adding shared wishlist to editor
                Logging.handleResponse(res, 500, null, function_name,
                    "Error deleting shared wishlist " + wishlist_id + " from editor " + editor_id + " by user " + req.user.id + ": " + error);
            }
        } catch (error) {
            Logging.handleResponse(res, 500, null, function_name,
                "Error deleting editor " + editor_id + " from firestore wishlist " + wishlist_id + " by user " + req.user.id + ": " + error);
        }
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error deleting editor " + editor_id + " from wishlist " + wishlist_id + " by user " + req.user.id + ": " + error);
    }
}

exports.renameWishlist = renameWishlist;
exports.getWishlistInner = getWishlistInner;
exports.addGameToWishlists = addGameToWishlists;
exports.removeGameFromWishlists = removeGameFromWishlists;
exports.addEditorToWishlist = addEditorToWishlist;
exports.deleteEditorFromWishlist = deleteEditorFromWishlist;