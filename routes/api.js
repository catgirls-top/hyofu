var express = require('express');
var router = express.Router();
const config = require("../config.json")

const enableCheck = (req,res,next)=>{
  if(!config.api.enabled) res.status(404).json({error:"Not found"})
  else next()
}

router.get('/',enableCheck, function(req, res) {
  res.send('respond with a resource');
});


module.exports = router;
