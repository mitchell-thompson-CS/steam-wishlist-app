const admin = require('firebase-admin');
const { getDb, setDb } = require("../../modules/firebase");
const axios = require("axios");
const { exportedForTesting, getWishlists, createWishlist, deleteWishlist } = require('../../modules/wishlists');
const { login } = require('../../modules/auth');
const { renameWishlist, getWishlistInner, addGameToWishlists, removeGameFromWishlists, addEditorToWishlist, deleteEditorFromWishlist } = require('../../modules/wishlistInner');
const { steamClient } = require('../../modules/game');

let res;
let req;
let firebaseAdmin;

async function clearFirestore() {
    await axios.delete("http://localhost:8080/emulator/v1/projects/steam-wishlist-app/databases/(default)/documents");
}

beforeAll(async () => {
    process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
    firebaseAdmin = admin.initializeApp({ projectId: "steam-wishlist-app" });
    setDb(firebaseAdmin.firestore());
});

beforeEach(async () => {
    await clearFirestore();

    req = {
        session: {
            prevPage: "http://localhost:3000",
            save: jest.fn(),
        },
        query: {
            redir: "http://localhost:3000"
        },
        body: {
            wishlist_name: "testWishlist"
        },
        user: {
            id: "12345",
            name: "testUserName",
            avatar: "testAvatarURL"
        },
        isAuthenticated: () => {
            if (req.user) {
                return true;
            } else {
                return false;
            }
        },
        logout: jest.fn(),
    }

    res = {
        status: -1,
        data: {},
        redirect_url: "",
        send: function (data) {
            this.data = data;
            return this;
        },
        sendStatus: function (code) {
            this.status = code;
            return this;
        },
        status: function (code) {
            this.status = code;
            return this;
        },
        redirect: function (url) {
            this.redirect_url = url;
            return this;
        }
    };
});

afterAll(async () => {
    await clearFirestore();
    await firebaseAdmin.delete();
    steamClient.logOff();
});


describe("Wishlist Inner", () => {
    test("renameWishlist - success", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body.wishlist_id = wishlist_id;
        req.body.wishlist_name = "newWishlistName";
        await renameWishlist(req,res);

        expect(res.status).toBe(200);
        

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);
        expect(wishlists.owned[wishlist_id].name).toBe("newWishlistName");
    });

    test("renameWishlist - failure - not the owner", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.user.id = "54321";
        req.body.wishlist_id = wishlist_id;
        req.body.wishlist_name = "newWishlistName";
        await renameWishlist(req,res);

        expect(res.status).toBe(403);
    })

    test("renameWishlist - failure - no wishlist name or id", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        req.body.wishlist_id = "";
        req.body.wishlist_name = "";
        await renameWishlist(req,res);

        expect(res.status).toBe(400);
    });

    test("renameWishlist - failure - invalid wishlist_name", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body.wishlist_id = wishlist_id;
        req.body.wishlist_name = "broken$ name ";
        await renameWishlist(req,res);

        expect(res.status).toBe(400);
    });

    test("getWishlistInner - success - owner access", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.params = {
            id: wishlist_id
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        // add games directly to the wishlist in the db
        let db = getDb();
        await db.collection('wishlists').doc(wishlist_id).update({
            games: {
                "testGameID": "testGameName"
            },
            editors: {
                "54321": db.collection('users').doc("54321")
            }
        });

        await getWishlistInner(req, res);
        expect(res.status).toBe(200);

        expect(res.data).toBeDefined();
        expect(res.data.name).toBe("testWishlist");
        expect(res.data.games).toBeDefined();
        expect(res.data.games).toEqual({ "testGameID": "testGameName" });
        expect(res.data.editors).toBeDefined();
        expect(res.data.editors).toEqual({ "54321": "54321" });
    });

    test("getWishlistInner - success - editor access", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.params = {
            id: wishlist_id
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        // add games directly to the wishlist in the db
        let db = getDb();
        await db.collection('wishlists').doc(wishlist_id).update({
            editors: {
                "54321": db.collection('users').doc("54321")
            }
        });

        req.user.id = "54321";
        await getWishlistInner(req, res);
        expect(res.status).toBe(200);

        expect(res.data).toBeDefined();
        expect(res.data.name).toBe("testWishlist");
        expect(res.data.games).toBeDefined();
        expect(res.data.editors).toBeDefined();
        expect(res.data.editors).toEqual({ "54321": "54321" });
    });

    test("getWishlistInner - failure - no wishlist", async () => {
        await login(req, res);

        req.params = {
            id: "12345"
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlistInner(req, res);
        expect(res.status).toBe(404);
    });

    test("getWishlistInner - failure - not an editor or owner", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.params = {
            id: wishlist_id
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        req.user.id = "543210";
        await getWishlistInner(req, res);
        expect(res.status).toBe(403);
    });

    test("getWishlistInner - failure - no id", async () => {
        await login(req, res);

        req.params = {
            id: ""
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlistInner(req, res);
        expect(res.status).toBe(400);
    });

    test("addGameToWishlists - success - owner", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "400",
            wishlists: [wishlist_id]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addGameToWishlists(req, res);
        expect(res.status).toBe(200);

        let db = getDb();
        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({ "400": "Portal" });
    });

    test("addGameToWishlists - success - editor", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "400",
            wishlists: [wishlist_id]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        let db = getDb();
        await db.collection('wishlists').doc(wishlist_id).update({
            editors: {
                "54321": db.collection('users').doc("54321")
            }
        });

        req.user.id = "54321";
        await addGameToWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({ "400": "Portal" });
    });

    test("addGameToWishlists - failure - no game id or wishlist id", async () => {
        await login(req, res);

        req.body = {
            game_id: "",
            wishlists: ""
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addGameToWishlists(req, res);
        expect(res.status).toBe(400);
    });

    test("addGameToWishlists - failure - game doesn't exist", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "-1",
            wishlists: [wishlist_id]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addGameToWishlists(req, res);
        expect(res.status).toBe(404);

        let wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({});

        req.body = {
            game_id: "200",
            wishlists: [wishlist_id]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addGameToWishlists(req, res);
        expect(res.status).toBe(404);

        wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({});
    });

    test("addGameToWishlists - failure - no wishlist", async () => {
        await login(req, res);

        req.body = {
            game_id: "400",
            wishlists: ["12345"]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addGameToWishlists(req, res);
        expect(res.status).toBe(404);
    });

    test("addGameToWishlists - failure - not an editor or owner", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "400",
            wishlists: [wishlist_id]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        req.user.id = "543210";
        await addGameToWishlists(req, res);
        expect(res.status).toBe(403);

        let db = getDb();
        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({});
    });

    test("removeGameFromWishlists - success - owner", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "400",
            wishlists: [wishlist_id]
        }

        await addGameToWishlists(req, res);

        let wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({ "400": "Portal" });

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await removeGameFromWishlists(req, res);
        expect(res.status).toBe(200);

        wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({});
    });

    test("removeGameFromWishlists - success - editor", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "400",
            wishlists: [wishlist_id]
        }

        await addGameToWishlists(req, res);

        let wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({ "400": "Portal" });

        res.status = function (code) {
            this.status = code;
            return this;
        }

        let db = getDb();
        await db.collection('wishlists').doc(wishlist_id).update({
            editors: {
                "54321": db.collection('users').doc("54321")
            }
        });

        req.user.id = "54321";
        await removeGameFromWishlists(req, res);
        expect(res.status).toBe(200);

        wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({});
    });

    test("removeGameFromWishlists - failure - no game id or wishlist id", async () => {
        await login(req, res);

        req.body = {
            game_id: "",
            wishlist_id: ""
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await removeGameFromWishlists(req, res);
        expect(res.status).toBe(400);
    });

    test("removeGameFromWishlists - failure - no game in wishlist", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "400",
            wishlists: [wishlist_id]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await removeGameFromWishlists(req, res);
        expect(res.status).toBe(404);
    });

    test("removeGameFromWishlists - failure - no wishlist", async () => {
        await login(req, res);

        req.body = {
            game_id: "400",
            wishlists: ["12345"]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await removeGameFromWishlists(req, res);
        expect(res.status).toBe(404);
    });

    test("removeGameFromWishlists - failure - not an editor or owner", async () => {
        await login(req, res);
        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;
        expect(wishlists).toBeDefined();
        expect(wishlists.owned).toBeDefined();
        expect(wishlists.shared).toBeDefined();
        expect(Object.keys(wishlists.owned).length).toBe(1);

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            game_id: "400",
            wishlists: [wishlist_id]
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addGameToWishlists(req, res);

        req.user.id = "543210";
        await removeGameFromWishlists(req, res);
        expect(res.status).toBe(403);

        let wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().games).toEqual({ "400": "Portal" });
    });

    test("addEditorToWishlist - success - owner", async () => {
        let db = getDb();
        await login(req, res);

        let req2 = {
            ...req,
            user: {
                id: "54321",
                name: "testUserName",
                avatar: "testAvatarURL"
            }
        }

        await login(req2, res);

        let editor_snapshot = await db.collection('users').doc("54321").get();
        expect(editor_snapshot.exists).toBe(true);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addEditorToWishlist(req, res);
        expect(res.status).toBe(200);

        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "54321": db.collection('users').doc("54321") });
    });
    
    test("addEditorToWishlist - success - editor already added", async () => {
        let db = getDb();
        await login(req, res);

        let req2 = {
            ...req,
            user: {
                id: "54321",
                name: "testUserName",
                avatar: "testAvatarURL"
            }
        }

        await login(req2, res);

        let editor_snapshot = await db.collection('users').doc("54321").get();
        expect(editor_snapshot.exists).toBe(true);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addEditorToWishlist(req, res);
        expect(res.status).toBe(200);

        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "54321": db.collection('users').doc("54321") });

        await addEditorToWishlist(req, res);
        expect(res.status).toBe(200);

        wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "54321": db.collection('users').doc("54321") });
    });

    test("addEditorToWishlist - failure - can't as editor", async () => {
        let db = getDb();
        await login(req, res);

        let req2 = {
            ...req,
            user: {
                id: "54321",
                name: "testUserName",
                avatar: "testAvatarURL"
            }
        }

        await login(req2, res);

        let editor_snapshot = await db.collection('users').doc("54321").get();
        expect(editor_snapshot.exists).toBe(true);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req2.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addEditorToWishlist(req2, res);
        expect(res.status).toBe(403);

        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({});
    });

    test("addEditorToWishlist - failure - no editor id or wishlist id", async () => {
        await login(req, res);

        req.body = {
            wishlist_id: "",
            editor_id: ""
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addEditorToWishlist(req, res);
        expect(res.status).toBe(400);
    });

    test("addEditorToWishlist - failure - owner can't add themselves", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "12345"
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addEditorToWishlist(req, res);
        expect(res.status).toBe(400);

        let wishlist = await getDb().collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({});
    });

    test("addEditorToWishlist - failure - editor doesn't exist", async () => {
        await login(req, res);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await addEditorToWishlist(req, res);
        expect(res.status).toBe(404);
    });

    test("deleteEditorFromWishlist - success - owner", async () => {
        let db = getDb();
        await login(req, res);

        let req2 = {
            ...req,
            user: {
                id: "54321",
                name: "testUserName",
                avatar: "testAvatarURL"
            }
        }

        await login(req2, res);

        let editor_snapshot = await db.collection('users').doc("54321").get();
        expect(editor_snapshot.exists).toBe(true);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        await addEditorToWishlist(req, res);

        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "54321": db.collection('users').doc("54321") });

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await deleteEditorFromWishlist(req, res);
        expect(res.status).toBe(200);

        wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({});
    });

    test("deleteEditorFromWishlist - success - editor doesn't exist", async () => {
        await login(req, res);

        await createWishlist(req, res);

        let db = getDb();
        let editor_snapshot = await db.collection('users').doc("54321").get();
        expect(editor_snapshot.exists).toBe(false);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        await deleteEditorFromWishlist(req, res);
        expect(res.status).toBe(200);
    });

    test("deleteEditorFromWishlist - failure - editor can't delete editors", async () => {
        let db = getDb();
        await login(req, res);

        let req2 = {
            ...req,
            user: {
                id: "54321",
                name: "testUserName",
                avatar: "testAvatarURL"
            }
        }

        await login(req2, res);

        let editor_snapshot = await db.collection('users').doc("54321").get();
        expect(editor_snapshot.exists).toBe(true);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        await addEditorToWishlist(req, res);

        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "54321": db.collection('users').doc("54321") });

        req.user.id = "54321";
        res.status = function (code) {
            this.status = code;
            return this;
        }

        await deleteEditorFromWishlist(req, res);
        expect(res.status).toBe(403);

        wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "54321": db.collection('users').doc("54321") });
    });

    test("deleteEditorFromWishlist - failure - no editor id or wishlist id", async () => {
        await login(req, res);

        req.body = {
            wishlist_id: "",
            editor_id: ""
        }

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await deleteEditorFromWishlist(req, res);
        expect(res.status).toBe(400);
    });

    test("deleteEditorFromWishlist - failure - not owner", async () => {
        let db = getDb();
        await login(req, res);

        let req2 = {
            ...req,
            user: {
                id: "54321",
                name: "testUserName",
                avatar: "testAvatarURL"
            }
        }

        let req3 = {
            ...req,
            user: {
                id: "543210",
                name: "testUserName",
                avatar: "testAvatarURL"
            }
        }

        await login(req2, res);
        await login(req3, res);

        let editor_snapshot = await db.collection('users').doc("54321").get();
        expect(editor_snapshot.exists).toBe(true);

        await createWishlist(req, res);

        res.status = function (code) {
            this.status = code;
            return this;
        }

        await getWishlists(req, res);
        expect(res.status).toBe(200);

        let wishlists = res.data;

        let wishlist_id = Object.keys(wishlists.owned)[0];

        req2.body = {
            wishlist_id: wishlist_id,
            editor_id: "54321"
        }

        req.body = {
            wishlist_id: wishlist_id,
            editor_id: "543210"
        }

        await addEditorToWishlist(req, res);
        expect(res.status).toBe(200);

        let wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "543210": db.collection('users').doc("543210") });

        await deleteEditorFromWishlist(req2, res);
        expect(res.status).toBe(403);
        wishlist = await db.collection('wishlists').doc(wishlist_id).get();
        expect(wishlist.data().editors).toEqual({ "543210": db.collection('users').doc("543210") });
    });
});