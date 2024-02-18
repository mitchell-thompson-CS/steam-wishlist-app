const { getGamePage, getGameData, searchGamePage } = require("../../modules/game");

describe("Game Module", () => {
    test("getGamePage", async () => {
        let req = {
            params: {
                game_id: "400"
            }
        };
        let res = {
            status: -1,
            send: jest.fn(),
            sendStatus: jest.fn(),
            status: function(code) {
                this.status = code;
                return this;
            }
        };
        await getGamePage(req, res);
        expect(res.send).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    // test("getGameData", () => {
    //     let game_id = "123";
    //     let res = getGameData(game_id);
    //     expect(res).toBeDefined();
    // });

    // test("searchGamePage", () => {
    //     let req = {
    //         params: {
    //             query: "123"
    //         }
    //     };
    //     let res = {
    //         send: jest.fn()
    //     };
    //     searchGamePage(req, res);
    //     expect(res.send).toHaveBeenCalled();
    // });
});
