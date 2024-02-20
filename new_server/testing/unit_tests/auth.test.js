const admin = require("firebase-admin");
const { getDb, setDb } = require("../../modules/firebase");
const axios = require("axios");
const { login, logout, savePrevPageToSession, isLoggedIn, getUser } = require("../../modules/auth");

process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
firebaseAdmin = admin.initializeApp({projectId: "steam-wishlist-app"});

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
            prevPage: "http://localhost:3000"
        },
        query: {
            redir: "http://localhost:3000"
        },
        user: {
            id: "12345",
            name: "testUserName",
            avatar: "testAvatarURL"
        },
        isAuthenticated: function() {
            return true;
        }
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

    test("Testing login", async () => {
        await login(req, res);
        expect(res.redirect_url).toBe("http://localhost:3000");
    });
});