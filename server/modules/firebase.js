require('dotenv').config({ path: __dirname + '/../../.env' });
const admin = require("firebase-admin");

let firebaseAdmin;

let db;

if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "test-dev") {  
  const serviceAccount = require(`../private/${process.env.FIREBASE_ADMIN_CREDENTIALS_FILE_NAME}`);
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