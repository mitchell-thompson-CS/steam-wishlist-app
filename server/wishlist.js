// var { admin } = require('./initFirebase');
// TODO: this only works with the below admin, the above admin doesn't work because of ArrayUnion. do we need to fix?
// also if its fine, we should probably rework app to make sure that initFirebase is run before everything
// i think its run somewhere before this right now and it works fine but not entirely properly i guess or guaranteed?
let admin = require('firebase-admin');
var { getGameData } = require('./game');
let { FirebaseError, UserError, LogLevels } = require('./errors');
let logging = require('./errors').Logging;
const { v4: uuidv4 } = require('uuid');

/** Gets a users owned and shared wishlists in a map and returns it
 * @params request object
 * @returns a map of the users wishlists
 * @throws UserError if user isn't logged in
 * @throws FirebaseError if there's a problem getting the wishlists
 */
async function getWishlists(req) {
    if (!req.user) {
        throw new UserError("User is not logged in");
    }
    return await admin.firestore().collection('users').doc(req.user.id).get().then(async (docSnapshot) => {
        if (!docSnapshot.exists) {
            throw new FirebaseError("Unable to get a user's wishlists");
        }
        let db_wishlists = docSnapshot.data().wishlists;
        let db_shared_wishlists = docSnapshot.data().shared_wishlists;
        let combined_wishlists = [...Object.values(db_wishlists), ...Object.values(db_shared_wishlists)];
        if (!combined_wishlists.length > 0) {
            return {};
        }
        return await admin.firestore().getAll(...combined_wishlists).then((wishlists) => {
            final_wishlists = {};
            for (let wishlist of wishlists) {
                final_wishlists[wishlist.id] = wishlist.data();
            }
            return final_wishlists;
        })
    });
}

// gets a users wishlists and sends them to the client
// sends the wishlists to the client as a JSON object
// @params request and response objects
async function getWishlistsPage(req, res) {
    let function_name = getWishlistPage.name;
    try {
        let wishlists = await getWishlists(req);
        // res.send(JSON.parse(JSON.stringify(wishlists)));
        // TODO: do we need to parse and stringify?
        logging.handleResponse(res, 200, JSON.parse(JSON.stringify(wishlists)), function_name,
            "Sent wishlists to client for user " + req.user.id);
    } catch (error) {
        logging.handleError(error, res);
    }

}

// creates a wishlist in the firestore database
// sends a 200 status code if successful
// @params request object with a wishlist_name in the body
// @params response object
function createWishlist(req, res) {
    let function_name = createWishlist.name;
    if (!req.user) {
        // user isn't logged in
        logging.handleResponse(res, 401, null, function_name,
            "User is not logged in");
        return;
    }
    var body = '';
    req.on('data', function (data) {
        body += data;

        if (body.length > 1e6)
            req.socket.destroy();
    });
    req.on('end', function () {
        let post = JSON.parse(body);
        var wishlist_name = post['wishlist_name'];
        console.log('creating a new wishlist: ' + wishlist_name);
        var new_id = uuidv4();

        if (!wishlist_name) {
            // wishlist name is empty
            logging.handleResponse(res, 400, null, function_name,
                "Wishlist name is empty in request by " + req.user.id);
            return;
        }
        // TODO: can we do this by setting a doc up here like below?
        // let doc = admin.firestore().collection('wishlists').doc(new_id);
        let wishdoc = admin.firestore().collection('wishlists').doc(new_id).get().then((wishsnapshot) => {
            if (wishsnapshot.exists) {
                logging.handleResponse(res, 500, null, function_name,
                    "Wishlist with id " + new_id + " already exists");
                return;
            }
            // wishlist doesn't exist, so we can go ahead and create it
            admin.firestore().collection('wishlists').doc(new_id).set({
                editors: {},
                name: post['wishlist_name'],
                games: {},
                owner: admin.firestore().collection('users').doc(req.user.id)
            }).then(() => {
                try {
                    admin.firestore().collection('users').doc(req.user.id).update({
                        [`wishlists.${new_id}`]: admin.firestore().collection('wishlists').doc(new_id)
                    }).then(() => {
                        // wishlist added to user
                        logging.handleResponse(res, 200, null, function_name,
                            "Wishlist " + new_id + " created by " + req.user.id);
                    });
                } catch (error) {
                    // problem with user not existing now, so we need to delete the wishlist
                    try {
                        admin.firestore().collection('wishlists').doc(new_id).delete();
                    } catch (error2) {
                        // problem deleting the wishlist
                        console.log("error deleting wishlist: " + error2);
                    }
                    logging.handleError(error, res);
                }
            });
        })
    })
}


// deletes a wishlist from the firestore database
// sends a 200 status code if successful
// @params request object with a wishlist_id in the body
// @params response object
function deleteWishlist(req, res) {
    let function_name = deleteWishlist.name;
    if (!req.user) {
        // user isn't logged in
        logging.handleResponse(res, 401, null, function_name,
            "User isn't logged in");
        return;
    }
    var body = '';
    req.on('data', function (data) {
        body += data;

        if (body.length > 1e6)
            req.socket.destroy();
    });

    req.on('end', function () {
        let post = JSON.parse(body);
        var wishlist_id = post['wishlist_id'];
        // TODO: add sanitization to the ids like this one that are inputted by user
        if (!wishlist_id) {
            // no wishlist id
            logging.handleResponse(res, 400, null, function_name,
                "No wishlist id provided by " + req.user.id);
            return;
        }
        admin.firestore().collection('wishlists').doc(wishlist_id).get().then(async (wishsnapshot) => {
            if (!wishsnapshot.exists) {
                // wishlist doesn't exist
                logging.handleResponse(res, 404, null, function_name,
                    "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
                return;
            }
            let data = wishsnapshot.data();
            // need to check permissions of user then can delete
            if (data.owner.id != req.user.id) {
                // user is not the owner
                logging.handleResponse(res, 403, null, function_name,
                    "User " + req.user.id + " is not the owner of wishlist " + wishlist_id);
                return;
            }
            try {
                // delete from user first, then will delete from editors
                await admin.firestore().collection('users').doc(req.user.id).update({
                    [`wishlists.${wishlist_id}`]: admin.firestore.FieldValue.delete()
                }).then(async () => {
                    for (let editor in data.editors) {
                        try {
                            await admin.firestore().collection('users').doc(editor).update({
                                [`shared_wishlists.${wishlist_id}`]: admin.firestore.FieldValue.delete()
                            });
                        } catch (error2) {
                            // editor doesn't exist
                            console.log("error deleting shared wishlist from " + editor + ": " + error2);
                        }
                    }
                });
            } catch (error) {
                // problem with user
            }

            // we will delete the wishlist regardless of if there was an error with the users
            // if there was an error getting the users, they likely don't exist so wishlist shouldn't exist
            try {
                await admin.firestore().collection('wishlists').doc(wishlist_id).delete()
                    .then(() => {
                        logging.handleResponse(res, 200, null, function_name,
                            "Wishlist " + wishlist_id + " deleted by " + req.user.id);
                    });
            } catch (error) {
                // couldn't delete wishlist
                logging.handleError(error, res);
            }
        })
    })
}

// gets a wishlist from the firestore database and sends it to the client
// @params request object that has a parameter with id
// @params response object
async function getWishlistPage(req, res) {
    let function_name = getWishlistPage.name;
    if (!req.user) {
        logging.handleResponse(res, 401, null, function_name,
            "User isn't logged in");
        return;
    }
    var wishlist = await admin.firestore().collection('wishlists').doc(req.params.id).get().then((wishsnapshot) => {
        if (!wishsnapshot.exists) {
            console.log(req.user.name + " tried to access a wishlist that doesn't exist");
            logging.handleResponse(res, 404, null, function_name,
                "Wishlist " + req.params.id + " doesn't exist by " + req.user.id);
            return;
        }
        var data = wishsnapshot.data();
        data['id'] = req.params.id;
        if (!data.editors[req.user.id] && data.owner.id != req.user.id) {
            logging.handleResponse(res, 403, null, function_name,
                "User " + req.user.id + " is not the owner or editor of wishlist " + req.params.id);
            return;
        }
        // res.render('wishlist', { user: req.user, wishlist: data });
        logging.handleResponse(res, 200, data, function_name, 
            "Sent wishlist " + req.params.id + " to user " + req.user.id);
    })
}

// adds a game to a wishlist in the firestore database
// sends a 200 status code if successful
// @params request object with a game_id and wishlist_id in the body
// @params response object
function addGameToWishlist(req, res) {
    let function_name = addGameToWishlist.name;
    if (!req.user) {
        // user isn't logged in
        logging.handleResponse(res, 401, null, function_name, 
            "User isn't logged in");
        return;
    }
    var body = '';
    req.on('data', function (data) {
        body += data;

        if (body.length > 1e6)
            req.socket.destroy();
    });

    req.on('end', function () {
        var post = JSON.parse(body);
        var game_id = post['game_id'];
        var wishlist_id = post['wishlist_id'];
        if (!game_id || !wishlist_id) {
            // no game id or wishlist id
            logging.handleResponse(res, 400, null, function_name, 
                "No game id or wishlist id given by user " + req.user.id);
            return;
        }
        let wishdoc = admin.firestore().collection('wishlists').doc(wishlist_id).get().then((wishsnapshot) => {
            if (!wishsnapshot.exists) {
                // wishlist doesn't exist
                logging.handleResponse(res, 404, null, function_name, 
                    "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
                return;
            }
            var data = wishsnapshot.data();

            if (!data.editors[req.user.id] && data.owner.id != req.user.id) {
                // user is not the owner or editor
                logging.handleResponse(res, 403, null, function_name, 
                    "User " + req.user.id + " is not the owner or editor of wishlist " + wishlist_id);
                return;
            }
            getGameData(game_id).then((gameData) => {
                if (!gameData) {
                    // game doesn't exist
                    logging.handleResponse(res, 400, null, function_name, 
                        "Game " + game_id + " doesn't exist");
                    return;
                }
                admin.firestore().collection('wishlists').doc(wishlist_id).update({
                    [`games.${game_id}`]: gameData[game_id]['data']['name']
                }).then(() => {
                    logging.handleResponse(res, 200, null, function_name, 
                        "Game " + game_id + " added to wishlist " + wishlist_id + " by user " + req.user.id);
                    return;
                });
            })
        })
    });
}

// removes a game from a wishlist in the firestore database
// sends a 200 status code if successful
// @params request object with a game_id and wishlist_id in the body
// @params response object
function removeGameFromWishlist(req, res) {
    let function_name = removeGameFromWishlist.name;
    if (!req.user) {
        // user isn't logged in
        logging.handleResponse(res, 401, null, function_name, 
            "User isn't logged in");
        return;
    }
    var body = '';
    req.on('data', function (data) {
        body += data;

        if (body.length > 1e6)
            req.socket.destroy();
    });

    req.on('end', function () {
        var post = JSON.parse(body);
        var game_id = post['game_id'];
        var wishlist_id = post['wishlist_id'];
        // TODO: add sanitization to the ids like this one that are inputted by user
        if (!game_id || !wishlist_id) {
            // no game id or wishlist id
            logging.handleResponse(res, 400, null, function_name, 
                "No game id or wishlist id given by user " + req.user.id);
            return;
        }
        let wishdoc = admin.firestore().collection('wishlists').doc(wishlist_id).get().then((wishsnapshot) => {
            if (!wishsnapshot.exists) {
                // wishlist doesn't exist
                logging.handleResponse(res, 404, null, function_name, 
                    "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
                return;
            }
            var data = wishsnapshot.data();

            if (!data.editors[req.user.id] && !data.owner.id == req.user.id) {
                // user is not the owner or editor
                logging.handleResponse(res, 403, null, function_name, 
                    "User " + req.user.id + " is not the owner or editor of wishlist " + wishlist_id);
                return;
            }
            admin.firestore().collection('wishlists').doc(wishlist_id).update({
                [`games.${game_id}`]: admin.firestore.FieldValue.delete()
            }).then(() => {
                logging.handleResponse(res, 200, null, function_name, 
                    "Game " + game_id + " removed from wishlist " + wishlist_id + " by user " + req.user.id);
                return;
            });
        });
    })
}

function addEditorToWishlist(req, res) {
    let function_name = addEditorToWishlist.name;
    if (!req.user) {
        // user isn't logged in
        logging.handleResponse(res, 401, null, function_name, 
            "User isn't logged in");
        return;
    }
    var body = '';
    req.on('data', function (data) {
        body += data;

        if (body.length > 1e6)
            req.socket.destroy();
    });

    req.on('end', function () {
        var post = JSON.parse(body);
        var wishlist_id = post['wishlist_id'];
        var editor_id = post['editor_id'];
        if (!wishlist_id || !editor_id) {
            // no wishlist id or editor id
            logging.handleResponse(res, 400, null, function_name, 
                "No wishlist id or editor id by user " + req.user.id);
            return;
        }
        admin.firestore().collection('wishlists').doc(wishlist_id).get().then(async (wishsnapshot) => {
            if (!wishsnapshot.exists) {
                // wishlist doesn't exist
                logging.handleResponse(res, 404, null, function_name, 
                    "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
                return;
            }
            var data = wishsnapshot.data();
            if (data.owner.id != req.user.id || data.editors[editor_id]) {
                if (data.owner.id != req.user.id) {
                    // user is not the owner
                    logging.handleResponse(res, 403, null, function_name, 
                        "User " + req.user.id + " is not the owner of wishlist " + wishlist_id);
                    return;
                } else {
                    // editor already exists
                    logging.handleResponse(res, 200, null, function_name, 
                        "Editor " + editor_id + " already exists in wishlist " + wishlist_id + " by user " + req.user.id);
                    return;
                }
            }
            try {
                await admin.firestore().collection('users').doc(editor_id).update({
                    [`shared_wishlists.${wishlist_id}`]: admin.firestore().collection('wishlists').doc(wishlist_id)
                }).then(async () => {
                    try {
                        await admin.firestore().collection('wishlists').doc(wishlist_id).update({
                            [`editors.${editor_id}`]: admin.firestore().collection('users').doc(editor_id)
                        }).then(() => {
                            logging.handleResponse(res, 200, null, function_name, 
                                "Editor " + editor_id + " added to wishlist " + wishlist_id + " by user " + req.user.id);
                            return;
                        });
                    } catch (error) {
                        // issue with adding shared wishlist to editor
                        logging.handleError(error, res);

                        // have to attempt to remove the editor from the wishlist again
                        try {
                            admin.firestore().collection('users').doc(editor_id).update({
                                [`shared_wishlists.${wishlist_id}`]: admin.firestore.FieldValue.delete()
                            });
                        } catch (error2) {
                            // issue with removing editor from the wishlist
                            console.log("error removing editor from wishlist after failing to add wishlist to editor:\n" + error2);
                        }
                    }
                });
            } catch (error) {
                logging.handleError(error, res);
            }
        })
    });

}

function deleteEditorFromWishlist(req, res) {
    let function_name = deleteEditorFromWishlist.name;
    if (!req.user) {
        // user isn't logged in
        logging.handleResponse(res, 401, null, function_name, 
            "User isn't logged in");
        return;
    }
    var body = '';
    req.on('data', function (data) {
        body += data;

        if (body.length > 1e6)
            req.socket.destroy();
    });

    req.on('end', function () {
        var post = JSON.parse(body);
        var wishlist_id = post['wishlist_id'];
        var editor_id = post['editor_id'];
        if (!wishlist_id || !editor_id) {
            // no wishlist id or editor id
            logging.handleResponse(res, 400, null, function_name, 
                "No wishlist id or editor id by user " + req.user.id);
            return;
        }
        let wishdoc = admin.firestore().collection('wishlists').doc(wishlist_id).get().then(async (wishsnapshot) => {
            if (!wishsnapshot.exists) {
                // wishlist doesn't exist
                logging.handleResponse(res, 404, null, function_name,
                    "Wishlist " + wishlist_id +" doesn't exist by user " + req.user.id);
                return;
            }
            var data = wishsnapshot.data();
            if (data.owner.id != req.user.id || !data.editors[editor_id]) {
                if (data.owner.id != req.user.id) {
                    // user is not the owner
                    logging.handleResponse(res, 403, null, function_name,
                        "User " + req.user.id + " is not the owner of wishlist " + wishlist_id + " by user " + req.user.id);
                    return;
                } else {
                    // editor does not exist
                    logging.handleResponse(res, 200, null, function_name,
                        "Editor " + editor_id + " does not exist in wishlist " + wishlist_id + " by user " + req.user.id);
                    return;
                }
            }
            try {
                await admin.firestore().collection('users').doc(editor_id).update({
                    [`shared_wishlists.${wishlist_id}`]: admin.firestore.FieldValue.delete()
                }).then(async () => {
                    try {
                        await admin.firestore().collection('wishlists').doc(wishlist_id).update({
                            [`editors.${editor_id}`]: admin.firestore.FieldValue.delete()
                        }).then(() => {
                            logging.handleResponse(res, 200, null, "deleteEditorFromWishlist",
                                "Editor " + editor_id + " deleted from wishlist " + wishlist_id + " by user " + req.user.id);
                            return;
                        });
                    } catch (error) {
                        // issue with adding shared wishlist to editor
                        // TODO: this issue could either be a firebase issue or that the editor doesn't exist, we should handle both
                        logging.handleError(error, res);
                    }
                });
            } catch (error) {
                logging.handleError(error, res);
            }
        })
    });
}


exports.getWishlistPage = getWishlistPage;
exports.getWishlists = getWishlists;
exports.createWishlist = createWishlist;
exports.addGameToWishlist = addGameToWishlist;
exports.getWishlistsPage = getWishlistsPage;
exports.deleteWishlist = deleteWishlist;
exports.removeGameFromWishlist = removeGameFromWishlist;
exports.addEditorToWishlist = addEditorToWishlist;
exports.deleteEditorFromWishlist = deleteEditorFromWishlist;