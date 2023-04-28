const express = require('express');
const bodyParser = require('body-parser');
const redis = require('./client')
const auth = require('basic-auth')
const compare = require('tsscmp')
const moment = require('moment')

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Basic function to validate credentials for example
function check(name, pass) {
    let valid = true

    // Simple method to prevent short-circut and use timing-safe compare
    valid = compare(name, 'john') && valid
    valid = compare(pass, 'secret') && valid

    return valid
}

async function shouldBeBlocked(name, userAgent) {
    const date = await redis.hGet(name, userAgent);

    if (!date) return false

    const login = moment(date)

    //todo: implement every hour execution
    const dateOfLastLogin = moment().subtract(1, 'hour')

    return login.isSameOrAfter(dateOfLastLogin) && login.isSameOrBefore(dateOfLastLogin.subtract(5, 'minute'))
}

async function isAuth(req, res, next) {
    const credentials = auth(req)

    // Check credentials
    // The "check" function will typically be against your user store
    if (!credentials || !check(credentials.name, credentials.pass)) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="example"')
        res.end('Access denied')
    } else if (await shouldBeBlocked(credentials.name, req.get('User-Agent'))) {
        res.end('is blocked for 5 minutes')
    } else {
        res.end('Access granted')
    }
}

//ignored adding user to DB for test
/*app.use('/register', (req, res) => {
    const auth = req.header('Authorization')
    // redis.
    res.send('login');
});*/

//Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ== is Aladdin:open sesame
app.use('/login', async (req, res) => {
    const credentials = auth(req)
// => { name: 'something', pass: 'whatever' }

    await redis.hSet(credentials.name, req.get('User-Agent'), Date.now())

    res.send('login');
});
app.use('/logout', isAuth, async (req, res) => {
    const credentials = auth(req)

    await redis.hDel(credentials.name, req.get('User-Agent'))
    res.send('logout');
});
app.use('*', (req, res) => {
    res.send('Not found!!!');
});

// const PORT = process.env.PORT || config.port;

const server = app.listen(3000, () => {
    console.log('server is running on port', server.address().port);
});
