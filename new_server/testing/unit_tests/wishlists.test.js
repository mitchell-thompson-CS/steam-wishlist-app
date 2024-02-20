const admin = require('firebase-admin');
const { getDb, setDb } = require("../../modules/firebase");
const axios = require("axios");
const { exportedForTesting, getWishlists, createWishlist } = require('../../modules/wishlists');
const { login } = require('../../modules/auth');

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
    await clearFirestore();
});


describe("Wishlists", () => {
    test("getWishlistsHelper", async () => {
        // create the user entry with login
        await login(req, res);

        // manually create the wishlists and add them to the user
        let wishlistCollection = await getDb().collection("wishlists");
        await wishlistCollection.doc("testWishlist").set({
            name: "testWishlist"
        });
        await wishlistCollection.doc("testWishlist2").set({
            name: "testWishlist2"
        });

        await wishlistCollection.doc("testWishlist3").set({
            name: "testWishlist3"
        });

        let collection = await getDb().collection("users");
        await collection.doc("12345").update({
            ["wishlists." + "testWishlist"]: wishlistCollection.doc("testWishlist"),
            ["wishlists." + "testWishlist2"]: wishlistCollection.doc("testWishlist2"),
            ["shared_wishlists." + "testSharedWishlist"]: wishlistCollection.doc("testWishlist3"),
        });

        // make sure that getWishlistHelper returns the correct wishlists
        let result = await exportedForTesting.getWishlistsHelper("12345");
        expect(result).toBeDefined();
        expect(result.owned).toBeDefined();
        expect(result.shared).toBeDefined();
        expect(result.owned.testWishlist).toBeDefined();
        expect(result.owned.testWishlist2).toBeDefined();
        expect(result.shared.testWishlist3).toBeDefined();
        expect(result.owned.testWishlist.name).toBe("testWishlist");
        expect(result.owned.testWishlist2.name).toBe("testWishlist2");
        expect(result.shared.testWishlist3.name).toBe("testWishlist3");
    })

    test("getWishlistsHelper - invalid format of db", async () => {
        // create the user entry with login
        await login(req, res);

        // manually create the wishlists and add them to the user
        let wishlistCollection = await getDb().collection("wishlists");

        let collection = await getDb().collection("users");
        await collection.doc("12345").update({
            ["wishlists." + "testWishlist"]: "test1",
            ["wishlists." + "testWishlist2"]: wishlistCollection.doc("testWishlist2"),
            ["shared_wishlists." + "testSharedWishlist"]: wishlistCollection.doc("testWishlist3"),
        });

        let result = await exportedForTesting.getWishlistsHelper("12345");
        expect(result).toBeDefined();
        expect(result.owned).toBeDefined();
        expect(result.shared).toBeDefined();
        expect(result.owned).toEqual({});
        expect(result.shared).toEqual({});
    });

    test("getWishlistsHelper - no user", async () => {
        let result = await exportedForTesting.getWishlistsHelper("12345");
        expect(result).toBeDefined();
        expect(result.owned).toBeDefined();
        expect(result.shared).toBeDefined();
        expect(result.owned).toEqual({});
        expect(result.shared).toEqual({});
    });

    test("getWishlists", async () => {
        // create the user entry with login
        await login(req, res);

        // manually create the wishlists and add them to the user
        let wishlistCollection = await getDb().collection("wishlists");
        await wishlistCollection.doc("testWishlist").set({
            name: "testWishlist"
        });
        await wishlistCollection.doc("testWishlist2").set({
            name: "testWishlist2"
        });

        await wishlistCollection.doc("testWishlist3").set({
            name: "testWishlist3"
        });

        let collection = await getDb().collection("users");
        await collection.doc("12345").update({
            ["wishlists." + "testWishlist"]: wishlistCollection.doc("testWishlist"),
            ["wishlists." + "testWishlist2"]: wishlistCollection.doc("testWishlist2"),
            ["shared_wishlists." + "testSharedWishlist"]: wishlistCollection.doc("testWishlist3"),
        });

        await getWishlists(req, res);

        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data.owned).toBeDefined();
        expect(res.data.shared).toBeDefined();
        expect(res.data.owned.testWishlist).toBeDefined();
        expect(res.data.owned.testWishlist2).toBeDefined();
        expect(res.data.shared.testWishlist3).toBeDefined();
        expect(res.data.owned.testWishlist.name).toBe("testWishlist");
        expect(res.data.owned.testWishlist2.name).toBe("testWishlist2");
        expect(res.data.shared.testWishlist3.name).toBe("testWishlist3");
    });

    test("createWishlist - success", async () => {
        await login(req, res);

        await createWishlist(req, res);

        expect(res.status).toBe(200);

        let collection = await getDb().collection("users").doc("12345").get();
        let data = collection.data();
        expect(data.wishlists).toBeDefined();
        for (let id in data.wishlists) {
            let wishlist = data.wishlists[id];
            expect(wishlist).toBeDefined();
            try {
                // test through the doc reference
                let doc = await wishlist.get()
                expect(doc.exists).toBe(true);
                expect(doc.data().name).toBe("testWishlist");

                // test through the wishlist collection
                let doc2 = await getDb().collection("wishlists").doc(id).get();
                expect(doc2.exists).toBe(true);
                expect(doc2.data().name).toBe("testWishlist");
            } catch (e) {
                console.log(e);
                expect(false).toBe(true);
            }
        }
    });

    test("createWishlist - failure - no wishlist_name", async () => {
        await login(req, res);

        req.body = {};
        await createWishlist(req, res);

        expect(res.status).toBe(400);
    });
});