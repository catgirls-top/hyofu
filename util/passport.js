const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const fs =require("fs")
function init(passport) {
    passport.use(
        new LocalStrategy({usernameField:"user",passwordField:"pass"},async function(username, password, done) {
            let config = JSON.parse(fs.readFileSync("./config.json"))
            if(username !== config.admin.user || await bcrypt.compare(password, config.admin.pass) == false) return done(null, false, { message:"Wrong user & password combination"})
            return done(null, "admin")
        })
    );

    passport.serializeUser(async (user, done) => {
        done(null, user);
    });

    passport.deserializeUser(async (id, done) => {
        done(id)

    });
}

module.exports = init;