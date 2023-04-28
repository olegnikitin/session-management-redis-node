const { createClient } = require('redis')

const host = process.env.REDIS_HOST || 'localhost'
const port = process.env.REDIS_PORT || 6379
const password = process.env.REDIS_PASSWORD || 'password123'

/* create and open the Redis OM Client */
const client = createClient({
    // url: 'redis://alice:foobared@awesome.redis.server:6380'
    url: `redis://:${password}@${host}:${port}`
});

client.on('error', err => console.log('Redis Client Error', err));

// (() => client.connect())()
// await client.connect();
client.connect();

// await client.set('key', 'value');
// const value = await client.get('key');
// await client.disconnect();

module.exports = client;
