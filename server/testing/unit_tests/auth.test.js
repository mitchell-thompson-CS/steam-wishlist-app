const admin = require("firebase-admin");
const { getDb, setDb } = require("../../modules/firebase");
const axios = require("axios");
const { login, logout, savePrevPageToSession, isLoggedIn, getUser } = require("../../modules/auth");

process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";

let res;
let req;

async function clearFirestore() {
    await axios.delete("http://localhost:8080/emulator/v1/projects/steam-wishlist-app/databases/(default)/documents");
}

beforeAll(async () => {
    firebaseAdmin = admin.initializeApp({projectId: "steam-wishlist-app"});
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
        send: function(data) {
            this.data = data;
            return this;
        },
        sendStatus: function(code) {
            this.status = code;
            return this;
        },
        status: function(code) {
            this.status = code;
            return this;
        },
        redirect: function(url) {
            this.redirect_url = url;
            return this;
        }
    };
});

afterAll(async () => {
    await clearFirestore();
});

describe("Auth", () => {
    test("getDb should return a database", () => {
        let db = getDb();
        expect(db).toBeDefined();
    });

    test("Login - success", async () => {
        await login(req, res);
        expect(res.redirect_url).toBe("http://localhost:3000");

        // verify that the login stored things in firebase
        let db = getDb();
        try {
            let collection = await db.collection("users");
            let doc = await collection.doc("12345").get();
            expect(doc.exists).toBe(true);
            expect(doc.data()).toBeDefined();
            expect(doc.data().shared_wishlists).toBeDefined();
            expect(doc.data().shared_wishlists).toEqual({});
            expect(doc.data().wishlists).toBeDefined();
            expect(doc.data().wishlists).toEqual({});
        } catch (e) {
            console.log(e);
            expect(false).toBe(true);
        }
    });

    test("Login - success - user already exists", async () => {
        let req2 = {
            ...req,
            user: {
                id: "12345",
                name: "testUserName2",
                avatar: "testAvatarURL2"
            },
            session: {
                prevPage: "http://localhost:3001",
            },
        }

        let res2 = {
            ...res,
            redirect_url: "",
            status: -1,
        }

        await login(req, res);
        expect(res.redirect_url).toBe("http://localhost:3000");

        try {
            // going to add test wishlist data into the user to make sure it doesn't delete when re-logging in
            let collection = await getDb().collection("users");
            await collection.doc("12345").update({
                ["wishlists." + "testWishlist"]: "testWishlistRef"
            });
            
        } catch (e) {
            console.log(e);
            expect(false).toBe(true);
        }

        await login(req2, res2);
        expect(res2.redirect_url).toBe("http://localhost:3001");

        // verify that the login stored things in firebase
        let db = getDb();
        try {
            let collection = await db.collection("users").get();
            expect(collection.size).toBe(1);
            for (let doc of collection.docs) {
                expect(doc.exists).toBe(true);
                expect(doc.data()).toBeDefined();
                expect(doc.data().shared_wishlists).toBeDefined();
                expect(doc.data().shared_wishlists).toEqual({});
                expect(doc.data().wishlists).toBeDefined();
                expect(doc.data().wishlists).toEqual({ testWishlist: "testWishlistRef" });
            }

            expect(collection.docs[0].id).toBe("12345");
        } catch (e) {
            console.log(e);
            expect(false).toBe(true);
        }
    });

    test("Logout - success", async () => {
        logout(req, res);
        expect(req.logout).toHaveBeenCalled();
    });

    test("GetUser - success", async () => {
        getUser(req, res);
        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual(req.user);
    });

    test("SavePrevPageToSession - success", async () => {
        req.query.redir = "http://localhost:3001";
        req.session.prevPage = "";

        await savePrevPageToSession(req, res);

        expect(req.session.prevPage).toBe("http://localhost:3001");
        expect(req.session.save).toHaveBeenCalled();
    });

    test("IsLoggedIn - success", async () => {
        let next = jest.fn()
        isLoggedIn(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("IsLoggedIn - failure", async () => {
        req.user = null;
        let next = jest.fn()
        isLoggedIn(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toBe(401);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });
});