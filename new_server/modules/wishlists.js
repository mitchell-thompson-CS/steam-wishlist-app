const { getDb } = require('./firebase')
const { Logging, LogLevels } = require('./logging')
const { v4: uuidv4 } = require('uuid');
const FieldValue = require('firebase-admin').firestore.FieldValue;

/** Gets a users wishlists and sends the wishlists to the client as a JSON object
 * @params request object
 * @params response object
 */
async function getWishlists(req, res) {
    let function_name = getWishlists.name;
    try {
        let wishlists = await getWishlistsHelper(req.user.id);
        Logging.handleResponse(res, 200, wishlists, function_name, "Sent wishlists to client for user " + req.user.id);
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name, "Error getting wishlists for user " + req.user.id + ": " + error);
    }
}

/** Creates a wishlist in the firestore database and sends a 200 status code if successful
 * @params request object with a wishlist_name in the body
 * @params response object
 */
async function createWishlist(req, res) {
    let function_name = createWishlist.name;
    let post = JSON.parse(JSON.stringify(req.body));
    let wishlist_name = post['wishlist_name'];
    Logging.log(function_name, "Attempting to create wishlist " + wishlist_name + " by " + req.user.id);
    let new_id = uuidv4();

    // wishlist wasn't given in the request
    if (!wishlist_name) {
        Logging.handleResponse(res, 400, null, function_name,
            "Wishlist name is empty in request by " + req.user.id);
        return;
    }

    try {
        // create wishlist in firestore
        let wishlistSnapshot = await getDb().collection('wishlists').doc(new_id).get()
        if (wishlistSnapshot.exists) {
            Logging.handleResponse(res, 500, null, function_name,
                "Wishlist with id " + new_id + " already exists");
            return;
        }

        // wishlist doesn't exist, so we can go ahead and create it
        await getDb().collection('wishlists').doc(new_id).set({
            editors: {},
            name: wishlist_name,
            games: {},
            owner: getDb().collection('users').doc(req.user.id)
        })

        try {
            // add the wishlist to the user
            await getDb().collection('users').doc(req.user.id).update({
                [`wishlists.${new_id}`]: getDb().collection('wishlists').doc(new_id)
            })
            // wishlist added to user
            Logging.handleResponse(res, 200, null, function_name,
                "Wishlist " + new_id + " created by " + req.user.id);
        } catch (error) {
            // problem adding the wishlist to the user
            try {
                await getDb().collection('wishlists').doc(new_id).delete();
            } catch (error2) {
                // problem deleting the wishlist
                Logging.log(function_name,
                    "Unable to delete wishlist " + new_id + " after failing to add to user " + req.user.id,
                    LogLevels.WARN);
            }
            Logging.handleResponse(res, 500, null, function_name,
                "Error adding wishlist " + new_id + " to user " + req.user.id + ": " + error);
        }
    } catch (error) {
        // problem creating the wishlist
        Logging.handleResponse(res, 500, null, function_name,
            "Error creating wishlist " + new_id + " by " + req.user.id + ": " + error);
    }
}

/** Deletes a wishlist from the firestore database and sends a 200 status code if successful
 * @params request object with a wishlist_id in the body
 * @params response object
 */
async function deleteWishlist(req, res) {
    let function_name = deleteWishlist.name;
    let post = JSON.parse(JSON.stringify(req.body));
    var wishlist_id = post['wishlist_id'];
    // TODO: add sanitization to the ids like this one that are inputted by user
    if (!wishlist_id) {
        // no wishlist id
        Logging.handleResponse(res, 400, null, function_name,
            "No wishlist id provided by " + req.user.id);
        return;
    }

    let wishlistSnapshot = await getDb().collection('wishlists').doc(wishlist_id).get()
    if (!wishlistSnapshot.exists) {
        // wishlist doesn't exist
        Logging.handleResponse(res, 404, null, function_name,
            "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
        return;
    }

    let data = wishlistSnapshot.data();
    // need to check permissions of user then can delete
    if (data.owner.id != req.user.id) {
        // user is not the owner
        Logging.handleResponse(res, 403, null, function_name,
            "User " + req.user.id + " is not the owner of wishlist " + wishlist_id);
        return;
    }

    try {
        // delete from user first, then will delete from editors
        await getDb().collection('users').doc(req.user.id).update({
            [`wishlists.${wishlist_id}`]: FieldValue.delete()
        })

        for (let editor in data.editors) {
            try {
                await getDb().collection('users').doc(editor).update({
                    [`shared_wishlists.${wishlist_id}`]: FieldValue.delete()
                });
            } catch (error2) {
                // editor doesn't exist
                Logging.log(function_name, "Unable to delete wishlist " + wishlist_id + " from editor " + editor, LogLevels.WARN);
            }
        }
    } catch (error) {
        // problem with user
    }

    // we will delete the wishlist regardless of if there was an error with the users
    // if there was an error getting the users, they likely don't exist so wishlist shouldn't exist
    try {
        await getDb().collection('wishlists').doc(wishlist_id).delete()
            .then(() => {
                Logging.handleResponse(res, 200, null, function_name,
                    "Wishlist " + wishlist_id + " deleted by " + req.user.id);
            });
    } catch (error) {
        // couldn't delete wishlist
        Logging.handleError(error, res);
    }
}

/** Gets a users owned and shared wishlists in a map and returns it
 * @params request object
 * @returns a map of the users wishlists
 */
async function getWishlistsHelper(user_id) {
    let function_name = "getWishlists";
    let final_wishlists = {};
    final_wishlists["owned"] = {};
    final_wishlists["shared"] = {};
    return await getDb().collection('users').doc(user_id).get().then(async (docSnapshot) => {
        if (!docSnapshot.exists) {
            Logging.log(function_name, "Issue getting user " + user_id + " from firestore", LogLevels.ERROR);
            return final_wishlists;
        }
        let db_wishlists = docSnapshot.data().wishlists;
        let db_shared_wishlists = docSnapshot.data().shared_wishlists;
        let combined_wishlists = [...Object.values(db_wishlists), ...Object.values(db_shared_wishlists)];
        if (!combined_wishlists.length > 0) {
            return final_wishlists;
        }

        try {
            // since we don't have any information about the wishlist reference we store in the user, we have to get the wishlists from firestore
            return await getDb().getAll(...combined_wishlists).then((wishlists) => {
                for (let wishlist of wishlists) {
                    if (wishlist.exists) {
                        if (db_wishlists[wishlist.id]) {
                            final_wishlists["owned"][wishlist.id] = wishlist.data();
                        } else {
                            final_wishlists["shared"][wishlist.id] = wishlist.data();
                        }
                    }
                }
                return final_wishlists;
            })
        } catch (e) {
            Logging.log(function_name, "Issue getting wishlists from firestore: " + e, LogLevels.ERROR);
            throw new Error("Issue getting wishlists from firestore");
        }
    });
}


exports.getWishlists = getWishlists;
exports.createWishlist = createWishlist;
exports.deleteWishlist = deleteWishlist;
exports.exportedForTesting = {
    getWishlistsHelper: getWishlistsHelper,
}