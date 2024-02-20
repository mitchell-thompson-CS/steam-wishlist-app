const admin = require("firebase-admin");
const serviceAccount = require("../private/steam-wishlist-app-firebase-adminsdk-ere8r-e012cbbea1.json");

let firebaseAdmin;

let db;

if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "test-dev") {
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
  firebaseAdmin = admin.initializeApp({projectId: "steam-wishlist-app"});
}

db = admin.firestore();

exports.admin = firebaseAdmin;

exports.getDb = () => {
  return db;
}

exports.setDb = (database) => {
  db = database;
}