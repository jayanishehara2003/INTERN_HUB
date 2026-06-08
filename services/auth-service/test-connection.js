const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function testConnection(uri) {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log(`Connection successful for ${uri}`);
        process.exit(0);
    } catch (err) {
        console.error(`Error connecting to ${uri}: ${err.message}`);
        process.exit(1);
    }
}

const uri = process.argv[2];
if (uri) {
    testConnection(uri);
}
