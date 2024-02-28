require('dotenv').config({path: __dirname + '/../../.env'});
const Typesense = require('typesense');

const typesenseClient = new Typesense.Client({
    'nodes': [{
        'host': 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
        'port': `${process.env.TYPESENSE_PORT}`,      // For Typesense Cloud use 443
        'protocol': 'http'   // For Typesense Cloud use https
    }],
    'apiKey': `${process.env.TYPESENSE_API_KEY}`,
    'connectionTimeoutSeconds': 2
});

exports.typesenseClient = typesenseClient;