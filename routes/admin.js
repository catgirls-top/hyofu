var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
  res.send('respond with a resource');
});

router.post('/login', (req, res) => {
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: true,
    successRedirect: "/users/profile"
  })
})

module.exports = router;