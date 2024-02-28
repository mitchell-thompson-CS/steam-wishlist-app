const setRateLimit = require('express-rate-limit');

let lowRateLimit;
let mediumRateLimit;
let highRateLimit;

let message = "Too many requests from this IP, please try again after a minute";
if (process.env.NODE_ENV === 'production') {
    lowRateLimit = setRateLimit({
        windowMs: 60 * 1000 * 10, // 10 minutes
        max: 5, // 5 requests
        message: message
    });

    mediumRateLimit = setRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 50, // 50 requests
        message: message
    });

    highRateLimit = setRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 150, // 150 requests
        message: message
    });
} else {
    let allRateLimits = setRateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 500, // 500 requests
        message: message
    });

    lowRateLimit = allRateLimits;
    mediumRateLimit = allRateLimits;
    highRateLimit = allRateLimits;
}

exports.lowRateLimit = lowRateLimit;
exports.mediumRateLimit = mediumRateLimit;
exports.highRateLimit = highRateLimit;