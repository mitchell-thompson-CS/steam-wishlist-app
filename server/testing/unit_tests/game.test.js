const { getGamePage, getGameData, searchGamePage } = require("../../modules/game");
const { startTypesense, exportedForTesting, searchTypesenseCollection } = require("../../modules/typesense");
const { typesenseClient } = require("../typesenseClient");

let resTemplate;

beforeAll(async () => {
    exportedForTesting.setTypesenseClient(typesenseClient);
    await startTypesense(true, "games_test");
});

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
    });

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

    test("getGameData - failure - nonexistant game_id", async () => {
        let game_id = "123";
        let res = await getGameData(game_id);

        expect(res).toBeDefined();
        expect(res[game_id]).toBeDefined();
        expect(res[game_id].success).toBe(false);
    });

    test("getGameData - success", async () => {
        let game_id = "400";
        let res = await getGameData(game_id);

        expect(res).toBeDefined();
        expect(res[game_id]).toBeDefined();
        expect(res[game_id].success).toBe(true);
        expect(res[game_id].data).toBeDefined();
        expect(res[game_id].data).toHaveProperty("name");
        expect(res[game_id].data).toHaveProperty("type");
        expect(res[game_id].data.name).toBe("Portal");
        expect(res[game_id].data.type).toBe("game");
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
