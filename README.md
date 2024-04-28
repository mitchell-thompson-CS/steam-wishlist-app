# Steam Wishlists
This project aims to allow users an easy way to create and manage multiple wishlists using the Steam platform. This allows for categorization and sharability that the Steam platform itself doesn't provide. Within this project there is a client and a server which can be found in their respective folders. The server acts as a REST API that allows the frontend to access information from a Firestore database and from various external APIs. The frontend was created with React and the backend was created with Node.js.

## Purpose
The main purpose of this project, as mentioned above, is to extend the functionality of the wishlist function built into Steam. This app allows categorization through multiple wishlists and easy management of them, allowing games to be easily added and removed.

# Building the Program

To build the program, enter the `server` directory and run `npm run build-run` which will build the client and then run it alongside the server. If you wish to just build the client, you can run `npm run build` inside of the `client` directory.

# Running the Program For Development

To run the program you will need to run the server and the client independently for testing. In the client directory you can run `npm start` and in the server directory you can run `npm start` or `npm run start-dev` for more logging information. Note: You will need to setup all the keys inside of the env for the program to run properly.

# Setting up for tests

## Local firebase emulators
Make sure the Firebase CLI is installed, using the command `firebase --version`
If it isn't installed you can generally install it using `npm install -g firebase-tools`
You can check out [Firebase CLI Reference](https://firebase.google.com/docs/cli#windows-npm) for more information.

At this point, you should be able to run `firebase emulators:start` inside of the `server/` directory. If it isn't you can initialize it using `firebase init emulators`. We only need `firestore` for our project.

See this link [Install and Configure Local Emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure) for more information.

## Typesense

Typesense needs to be installed and its API key in the env file (currently Typesense only works with a local Typesense session).

More information about setting up Typesense can be found [here](https://typesense.org/docs/guide/install-typesense.html)

# Running Tests

`npm test` inside the `server/` directory or `npm run test-dev` for more logging information.

# Credits
Program created by Mitchell Thompson and Jacob White.