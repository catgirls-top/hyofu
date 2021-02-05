var express = require('express');
var router = express.Router();
var config = require(`../config.json`)
const passport = require("passport")

router.get('/', function (req, res) {
  if(req.isAuthenticated()){
    return res.redirect("/admin/panel")
  }
  res.render("admin_login",{sitename:config.site_name,messages:{error:undefined}});
});

router.post('/login', passport.authenticate("local", {
  failureRedirect: "/admin",
  failureFlash: true,
  successRedirect: "/users/profile"
}))

module.exports = router;