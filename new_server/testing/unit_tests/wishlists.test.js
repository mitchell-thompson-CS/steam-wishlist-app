const admin = require('firebase-admin');
const { getDb, setDb } = require("../../modules/firebase");
const axios = require("axios");
const { exportedForTesting, getWishlists, createWishlist, deleteWishlist } = require('../../modules/wishlists');
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
            name: "testWishlist",
            owner: getDb().collection("users").doc("12345"),
            editors: {
                "12345": getDb().collection("users").doc("12345")
            },
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

        expect(result.owned.testWishlist.owner).toBeDefined();
        expect(result.owned.testWishlist.editors).toBeDefined();
        expect(result.owned.testWishlist.owner).toBe("12345");
        for (editor in result.owned.testWishlist.editors){
            expect(editor).toBeDefined();
            expect(editor).toBe("12345");
        }

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

        let error = false;
        try {
            await exportedForTesting.getWishlistsHelper("12345");
        } catch (e) {
            error = true;
        }
        expect(error).toBe(true);
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

    test("getWishlists - failure - db format broken", async () => {
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
            ["wishlists." + "testWishlist"]: "testString",
            ["wishlists." + "testWishlist2"]: wishlistCollection.doc("testWishlist2"),
            ["shared_wishlists." + "testSharedWishlist"]: wishlistCollection.doc("testWishlist3"),
        });

        await getWishlists(req, res);

        expect(res.status).toBe(500);
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

    test("deleteWishlist - success", async () => {
        await login(req, res);

        let req2 = {
            ...req,
            user: {
                id: "54321",
                name: "testUserName2",
                avatar: "testAvatarURL"
            },
        }

        await login(req2, res);

        // create the wishlist
        await createWishlist(req, res);

        res.status = -1;

        // get the wishlist
        let collection = await getDb().collection("users").doc("12345").get();
        let data = collection.data();
        let wishlist_id = Object.keys(data.wishlists)[0];

        expect(wishlist_id).toBeDefined();

        // add the wishlist to the other user
        await getDb().collection("wishlists").doc(wishlist_id).update({
            editors: {
                "54321": getDb().collection("users").doc("54321")
            }
        });

        await getDb().collection("users").doc("54321").update({
            ["shared_wishlists." + wishlist_id]: getDb().collection("wishlists").doc(wishlist_id)
        });

        // make sure editor was added
        let wishlist_collection = await getDb().collection("wishlists").doc(wishlist_id).get();
        let wishlist_data = wishlist_collection.data();
        let user2 = await getDb().collection("users").doc("54321");
        let user2_data = await user2.get();
        expect(wishlist_data.editors).toBeDefined();
        expect(wishlist_data.editors["54321"]).toBeDefined();
        expect(await wishlist_data.editors["54321"]).toEqual(await user2);
        expect(user2_data.data()).toBeDefined();
        expect(user2_data.data().shared_wishlists).toBeDefined();
        expect(user2_data.data().shared_wishlists[wishlist_id]).toBeDefined();
        expect(await user2_data.data().shared_wishlists[wishlist_id]).toEqual(await getDb().collection("wishlists").doc(wishlist_id));


        // delete the wishlist
        req.body = {
            wishlist_id: wishlist_id
        }
        await deleteWishlist(req, res);

        expect(res.status).toBe(200);

        // make sure it was deleted
        let collection2 = await getDb().collection("users").doc("12345").get();
        let data2 = collection2.data();
        expect(data2.wishlists).toBeDefined();
        expect(data2.wishlists[wishlist_id]).toBeUndefined();

        let collection3 = await getDb().collection("wishlists").doc(wishlist_id).get();
        expect(collection3.exists).toBe(false);
    });

    test("deleteWishlist - failure - no wishlist_id", async () => {
        await login(req, res);

        req.body = {};
        await deleteWishlist(req, res);

        expect(res.status).toBe(400);
    });
});