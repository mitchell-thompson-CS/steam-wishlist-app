const admin = require("firebase-admin");
const { getDb, setDb } = require("../../modules/firebase");
const axios = require("axios");

process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
firebaseAdmin = admin.initializeApp({projectId: "steam-wishlist-app"});

setDb(firebaseAdmin.firestore());

async function clearFirestore() {
    await axios.delete("http://localhost:8080/emulator/v1/projects/steam-wishlist-app/databases/(default)/documents");
}

beforeEach(async () => {
    await clearFirestore();
});

afterAll(async () => {
    await clearFirestore();
});

describe("Firebase", () => {    
    test("getDb should return a database", () => {
        let db = getDb();
        expect(db).toBeDefined();
    });

    test("Reading collection 'test' and doc 'test' without setting values", async () => {
        let db = getDb();
        try {
            let collection = await db.collection("test");
            let doc = await collection.doc("test");
            expect(doc).toBeDefined();
        } catch (e) {
            console.log(e);
            expect(false).toBe(true);
        }
    })

    test("Adding test data to firestore, then reading it", async () => {
        let db = getDb();
        try {
            let collection = await db.collection("test");
            let doc = await collection.doc("test").set({testingField1: "test1"});
            // let field = doc.get("test");
            expect(doc).toBeDefined();

            let res = await collection.doc("test").get();
            expect(res).toBeDefined();
            expect(res.exists).toBe(true);
            expect(res.data()).toBeDefined();
            expect(res.data().testingField1).toBe("test1");
        } catch (e) {
            console.log(e);
            expect(false).toBe(true);
        }
    });
});