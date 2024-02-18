require('dotenv').config({path: __dirname + '/../../../.env'});
const { exportedForTesting, searchForGame } = require("../../modules/typesense");

beforeEach(async () => {
    await exportedForTesting.clearTypesenseCollection("games");
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

it("searchForGame with initialized typesense with games collection", async () => {
    await exportedForTesting.initializeTypesenseCollection(exportedForTesting.gameSchema);
    await exportedForTesting.setupTypeSenseCollection('games', await exportedForTesting.getSteamData());
    const results = await searchForGame("Half-Life 2");
    expect(results).toBeDefined()
    expect(results.hits).toBeDefined()
    expect(results.hits[0].document).toBeDefined()
    expect(results.hits[0].document.name).toBe("Half-Life 2")
});

it("searchForGame with empty games collection", async () => {
    await exportedForTesting.initializeTypesenseCollection(exportedForTesting.gameSchema);
    const results = await searchForGame("Half-Life 2");
    expect(results).toBeDefined()
    expect(results.hits).toBeDefined()
});

it("searchForGame with uninitialized typesense", async () => {
    const results = await searchForGame("Half-Life 2");
    expect(results).toBeDefined()
    expect(results).toEqual({})
})