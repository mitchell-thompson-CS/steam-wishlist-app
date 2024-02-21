const admin = require("firebase-admin");
const serviceAccount = require("../private/steam-wishlist-app-firebase-adminsdk-ere8r-e012cbbea1.json");

let firebaseAdmin;

let db;

if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "test-dev") {
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = firebaseAdmin.firestore();
}

exports.admin = firebaseAdmin;

exports.getDb = () => {
  return db;
}

exports.setDb = (database) => {
  db = database;
}