var express = require('express');
var router = express.Router();
var config = require(`../config.json`)

router.get('/', function (req, res) {
  res.render('index',{
    multi:config.multipleFileUpload,
    sitename:config.site_name
  });
});

router.get("/delete",(req,res)=>{
  res.render("delete",{url:req.hostname})
})



module.exports = router;
