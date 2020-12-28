var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload',(req,res)=>{
  console.log(req.files !== undefined ? req.files : "No file uploaded")
})

module.exports = router;
