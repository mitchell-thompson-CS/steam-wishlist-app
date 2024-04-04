const { getGamePage, getGameData, searchGamePage, getGamesPage } = require("../../modules/game");
const { startTypesense, exportedForTesting, searchTypesenseCollection } = require("../../modules/typesense");
const { typesenseClient } = require("../typesenseClient");

let resTemplate;

beforeAll(async () => {
    exportedForTesting.setTypesenseClient(typesenseClient);
    await startTypesense(true, "games_test");
}, 10000);

afterAll(async () => {
    await exportedForTesting.clearTypesenseCollection("games_test");
});

beforeEach(() => {
    resTemplate = {
        status: -1,
        data: {},
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
        }
    };
});

describe("Game Module", () => {
    test("getGamePage - success", async () => {
        let req = {
            params: {
                game_id: "400"
            }
        };
        let res = resTemplate;
        
        await getGamePage(req, res);

        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data).toHaveProperty("name");
        expect(res.data).toHaveProperty("type");
        expect(res.data.name).toBe("Portal");
        expect(res.data.type).toBe("game");
    }, 7500);

    test("getGamePage - failure - invalid id", async () => {
        let req = {
            params: {
                game_id: "asdfg"
            }
        };
        let res = resTemplate;
        
        await getGamePage(req, res);

        expect(res.status).toBe(404);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGamePage - failure - no id", async () => {
        let req = {
            params: {}
        };
        let res = resTemplate;
        
        await getGamePage(req, res);

        expect(res.status).toBe(400);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGamePage - failure - no params", async () => {
        let req = {}
        let res = resTemplate;

        await getGamePage(req, res);

        expect(res.status).toBe(400);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGamesPage - success", async () => {
        let req = {
            params: {
                game_ids: JSON.stringify(["400", "105600", "620"])
            }
        }

        let res = resTemplate;
        await getGamesPage(req, res);

        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data).toHaveProperty("400");
        expect(res.data).toHaveProperty("105600");
        expect(res.data).toHaveProperty("620");
        expect(res.data["400"]).toHaveProperty("name");
        expect(res.data["400"]).toHaveProperty("type");
        expect(res.data["400"].name).toBe("Portal");
        expect(res.data["400"].type).toBe("game");
        expect(res.data["105600"]).toHaveProperty("name");
        expect(res.data["105600"]).toHaveProperty("type");
        expect(res.data["105600"].name).toBe("Terraria");
        expect(res.data["105600"].type).toBe("game");
        expect(res.data["620"]).toHaveProperty("name");
        expect(res.data["620"]).toHaveProperty("type");
        expect(res.data["620"].name).toBe("Portal 2");
        expect(res.data["620"].type).toBe("game");
    }, 10000);

    test("getGamesPage - failure - no body", async () => {
        let req = {};
        let res = resTemplate;
        await getGamesPage(req, res);

        expect(res.status).toBe(400);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGamesPage - failure - empty body", async () => {
        let req = {
            params: {}
        };
        let res = resTemplate;
        await getGamesPage(req, res);

        expect(res.status).toBe(400);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGamesPage - failure - no game_ids", async () => {
        let req = {
            params: {
                game_ids: []
            }
        };
        let res = resTemplate;
        await getGamesPage(req, res);

        expect(res.status).toBe(400);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGamesPage - failure - invalid input type", async () => {
        let req = {
            params: {
                game_id: 400,
                game_ids: 400
            }
        };
        let res = resTemplate;
        await getGamesPage(req, res);

        expect(res.status).toBe(400);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGamesPage - failure - nonexistant game_ids", async () => {
        let req = {
            params: {
                game_ids: JSON.stringify(["-123", "-456", "-789"])
            }
        };
        let res = resTemplate;
        await getGamesPage(req, res);

        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });

    test("getGameData - failure - nonexistant game_id", async () => {
        let game_id = "-123";
        let res = await getGameData(game_id);

        expect(res).toEqual(null);
    });

    test("getGameData - success", async () => {
        let game_id = "400";
        let res = await getGameData(game_id);
        
        expect(res).toBeDefined();
        expect(res).toHaveProperty("name");
        expect(res).toHaveProperty("type");
        expect(res.name).toBe("Portal");
        expect(res.type).toBe("game");
    });

    test("searchGamePage - failure", async () => {
        let req = {
            params: {}
        };
        let res = resTemplate;
        await searchGamePage(req, res);
        expect(res.status).toBe(400);
        expect(res.data).toBeDefined();
        expect(res.data).toEqual({});
    });
});
