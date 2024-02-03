var admin = require("firebase-admin");
var firebase_app = require("firebase/app");

var serviceAccount = require("./private/steam-wishlist-app-firebase-adminsdk-ere8r-e012cbbea1.json");


require("dotenv").config();

const firebaseConfig = {
  apiKey: `${process.env.FIREBASE_API_KEY}`,
  authDomain: `${process.env.FIREBASE_AUTH_DOMAIN}`,
  projectId: `${process.env.FIREBASE_PROJECT_ID}`,
  storageBucket: `${process.env.FIREBASE_STORAGE_BUCKET}`,
  messagingSenderId: `${process.env.FIREBASE_MESSAGING_SENDER_ID}`,
  appId: `${process.env.FIREBASE_APP_ID}`,
  measurementId: `${process.env.FIREBASE_MEASUREMENT_ID}`,
};

const firebaseApp = firebase_app.initializeApp(firebaseConfig);

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.admin = firebaseAdmin;