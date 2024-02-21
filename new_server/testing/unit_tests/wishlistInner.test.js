const admin = require('firebase-admin');
const { getDb, setDb } = require("../../modules/firebase");
const axios = require("axios");
const { exportedForTesting, getWishlists, createWishlist, deleteWishlist } = require('../../modules/wishlists');
const { login } = require('../../modules/auth');
const { renameWishlist } = require('../../modules/wishlistInner');

process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
firebaseAdmin = admin.initializeApp({ projectId: "steam-wishlist-app" });

setDb(firebaseAdmin.firestore());

let res;
let req;

async function clearFirestore() {
    await axios.delete("http://localhost:8080/emulator/v1/projects/steam-wishlist-app/databases/(default)/documents");
}

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
    // await clearFirestore();
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
});