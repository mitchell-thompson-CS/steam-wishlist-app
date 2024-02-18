require('dotenv').config({path: __dirname + '/../../../.env'});
const { exportedForTesting, searchForGame, startTypesense, searchTypesenseCollection } = require("../../modules/typesense");
let testSchema = exportedForTesting.gameSchema;
testSchema.name = "games_test";

let searchParameters = {
    'q': "Half-Life 2",
    'query_by': 'name',
    'per_page': 10,
};

beforeEach(async () => {
    await exportedForTesting.clearTypesenseCollection("games_test");
});

it("Typesense health", async () => {
    const health = await exportedForTesting.checkTypesenseHealth();
    expect(health).toBe(true);
});

it("steamData is not empty", async () => {
    const data = await exportedForTesting.getSteamData();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
});

it("searchForGame with initialized typesense with games_test collection", async () => {
    await exportedForTesting.initializeTypesenseCollection(testSchema);
    let setup = await exportedForTesting.setupTypeSenseCollection('games_test', await exportedForTesting.getSteamData());
    expect(setup).toBeDefined();
    expect(setup.length).toBeGreaterThan(0);

    const results = await searchTypesenseCollection("games_test", searchParameters);
    expect(results).toBeDefined()
    expect(results.hits).toBeDefined()
    expect(results.hits[0].document).toBeDefined()
    expect(results.hits[0].document.name).toBe("Half-Life 2")
}, 10000);

it("searchForGame with empty games_test collection", async () => {
    await exportedForTesting.initializeTypesenseCollection(testSchema);
    const results = await searchTypesenseCollection("games_test", searchParameters);
    expect(results).toBeDefined()
    expect(results.hits).toBeDefined()
}, 7500);

it("searchForGame with uninitialized typesense", async () => {
    const results = await searchTypesenseCollection("games_test", searchParameters);
    expect(results).toBeDefined()
    expect(results).toEqual({})
});

it("searchForGame with final startTypesense true", async () => {
    await startTypesense(true, "games_test");
    const results = await searchTypesenseCollection("games_test", searchParameters);
    expect(results).toBeDefined()
    expect(results.hits).toBeDefined()
    expect(results.hits[0].document).toBeDefined()
    expect(results.hits[0].document.name).toBe("Half-Life 2")
}, 10000);

it("searchForGame with final startTypesense false", async () => {
    await startTypesense(false, "games_test");
    const results = await searchTypesenseCollection("games_test", searchParameters);
    expect(results).toBeDefined()
    expect(results.hits).toBeDefined()
    expect(results.hits[0].document).toBeDefined()
    expect(results.hits[0].document.name).toBe("Half-Life 2")
}, 10000);