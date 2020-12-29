var express = require('express');
var router = express.Router();


router.get('/', function (req, res, next) {
  res.render('index');
});

router.get("/delete",(req,res)=>{
  
  res.render("delete",{url:req.hostname})
})

module.exports = router;