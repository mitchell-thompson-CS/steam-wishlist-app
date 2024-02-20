const { app } = require('./server');

// const { start_typesense } = require('./typesense.js');

// start_typesense();

app.listen(3001);
console.log("Server started on port 3001");