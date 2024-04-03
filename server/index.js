const { app } = require('./modules/server');
const { startTypesense } = require('./modules/typesense');

app.listen(3001, () => {
    startTypesense(true);
    console.log("Server started on port 3001");  
});