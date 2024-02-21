const { app } = require('./modules/server');

app.listen(3001, () => {
    console.log("Server started on port 3001");  
});