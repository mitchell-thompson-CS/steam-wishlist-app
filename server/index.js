const { app } = require('./modules/server');
const { startTypesense } = require('./modules/typesense');
const schedule = require('node-schedule');

const PORT = 3001;

const typeSenseCB = () => {
    startTypesense(false);
}

// every day at 10:05 AM, re-initialize the typesense in case new games were added to Steam
schedule.scheduleJob('0 5 10 * * *', typeSenseCB);

app.listen(PORT, () => {
    startTypesense(true);
    console.log("Server started on port " + PORT);  
});