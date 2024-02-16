const setRateLimit = require('express-rate-limit');

const rateLimit = setRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // limit to this for each windowMs
    message: "Too many requests from this IP, please try again after a minute",
    headers: true,
    keyGenerator: function (req) {
        return req.user ? req.user.id : req.ip;
    }
});

module.exports = rateLimit;