const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function init(passport) {
    passport.use(
        new LocalStrategy({usernameField:"user",passwordField:"pass"},function(username, password, done) {
            
        })
    );

    passport.serializeUser(async (user, done) => {
        done(null, user);
    });

    passport.deserializeUser(async (id, done) => {
        done(user)

    });
}

module.exports = init;