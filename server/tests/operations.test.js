// const {
//     initializeAdminApp,
//     clearFirestoreData,
//     apps,
// } = require("@firebase/rules-unit-testing");
const firebase_testing = require('@firebase/rules-unit-testing');
const fs = require("fs");

const { setDb, getDb } = require("../initFirebase");

const admin = require('firebase-admin');
const { login } = require("../auth");


let firebase_app;

process.env['FIRESTORE_EMULATOR_HOST'] = "localhost:8080";

const db = admin.firestore();

const { app } = require("../server");
const supertest = require('supertest');


async function authedApp() {
    const test_app = await firebase_testing.initializeTestEnvironment({ projectId: "steam-wishlist-app", firestore: { rules: fs.readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080}});
    return test_app;
}

beforeEach(async () => {
    firebase_app = await authedApp();
    // Set the emulator database before each test
    setDb(db);
});

beforeEach(async () => {
    // Clear the database before each test
    await firebase_app.clearFirestore();
});

afterEach(async () => {
    
    // Clean up the apps between tests.
    // await Promise.all(app.map((app) => app.delete()));
    await firebase_app.cleanup();
});

test("GET /api/wishlists", async () => {
    // const res = await app.get("/api/wishlists");
    // expect(res.status).toBe(200);
    // expect(res.body).toEqual([]);
    await supertest(app).get("/api/wishlists").expect(401);
});

// i want to make a mock openid request to this so it will log me in
test("GET /api/auth/steam", async () => {
    await supertest(app)
    .get("/api/auth/steam")
    .expect(302)
    .expect("Location", /steamcommunity.com/)    
});
