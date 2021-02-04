var express = require('express');
var router = express.Router();
var config = require(`../config.json`)
/* GET users listing. */
router.get('/', function (req, res) {
  res.render("admin",{sitename:config.site_name});
});

router.post('/login', (req, res) => {
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: true,
    successRedirect: "/users/profile"
  })
})

module.exports = router;