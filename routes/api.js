var express = require('express');
var router = express.Router();
const config = require("../config.json")
const fs = require("fs")

let ratelimitTemp = {}

const enableCheck = (req, res, next) => {
  if (!config.api.enabled) res.status(404).json({
    error: "Not found"
  })
  else next()
}

router.get('/', enableCheck, function (req, res) {
  res.send('respond with a resource');
});

router.post('/upload', (req, res) => {
  let ratelimits
  fs.readFile("./files/ratelimits.json", 'utf8', (err, data) => {
    if (err) return res.status(500).send(err)
    ratelimits = JSON.parse(data)
    if (!req.files) return res.status(400).send("No file")
    console.log(ratelimits[req.headers["cf-connecting-ip"]])
    if ((config.ratelimit.usingCloudflare) ? ratelimits[req.headers["cf-connecting-ip"]] !== undefined && ratelimits[req.headers["cf-connecting-ip"]].ratelimited == true : ratelimits[req.ip] !== undefined && ratelimits[req.ip].ratelimited == true) return res.status(403).set("RateLimit-Limit", `${config.ratelimit.ratelimitAfter} requests/${config.ratelimit.ratelimit}ms`).send("You are being rate-limited")
    if (req.files.file.size > config.maxfilesize && config.maxfilesize !== -1) {
      return res.status(413).send("too big")
    } else {
      if (!fs.existsSync("./public/" + config.uploadFolder)) fs.mkdirSync("./public/" + config.uploadFolder);
      let ext = req.files.file.name.split('.').pop();
      let blockUpload = false
      if (config.blockedExtensions !== undefined) {
        let blocked = config.blockedExtensions.split(",")
        if (!blocked) {
          if (ext == config.blockedExtensions) return res.status(403).send("This filetype is not alowed")
        } else {
          blocked.forEach((blockedEx) => {
            if (ext == blockedEx) blockUpload = true
          })
        }
      }
      if (blockUpload) return res.status(403).send("This filetype is not allowed")
      var name = '';
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
      for (var i = 0; i < 8; i++) {
        name += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      req.files.file.mv("./public/" + config.uploadFolder + `/${name}.${ext}`, async function (err) {
        if (err) {
          return res.status(500).send(err)
        }

        //* RATELIMIT
        if (config.ratelimit.ratelimit !== -1) {
          let newObj
          //* if using cloudflare
          if (config.ratelimit.usingCloudflare) {
            //* if no entry in ratelimits DB, create on
            if (!ratelimits[req.headers["cf-connecting-ip"]]) {
              newObj = ratelimits;
              newObj[req.headers["cf-connecting-ip"]] = {ratelimited:false,requests:1}
            }
            //* if entry has timeout, clear it
            if(ratelimitTemp[req.headers["cf-connecting-ip"]] !== undefined){
              clearTimeout(ratelimits[req.headers["cf-connecting-ip"]].timeout)
            }
            //* if number of requests is equal to set ratelimit after, set as ratelimit
            if(ratelimits[req.headers["cf-connecting-ip"]].requests==config.ratelimit.ratelimitAfter){
              newObj = ratelimits;
              newObj[req.headers["cf-connecting-ip"]] = {ratelimited:true,requests:0}
            }
            //* else just add one request
            else{
              newObj = ratelimits;
              newObj[req.headers["cf-connecting-ip"]] = {ratelimited:false,requests:ratelimits[req.headers["cf-connecting-ip"]].requests+1}
            }
          }
          //* else do the same but with req.ip
          else{
            //* if no entry in ratelimits DB, create on
            newObj = ratelimits;
            if (!ratelimits[req.ip]) {
              newObj[req.ip] = {ratelimited:false,requests:1}
            }
            //* if entry has timeout, clear it
            if(ratelimitTemp[req.ip] !== undefined){
              clearTimeout(ratelimits[req.ip].timeout)
            }
            //* if number of requests is equal to set ratelimit after, set as ratelimit
            if(ratelimits[req.ip].requests==config.ratelimit.ratelimitAfter){
              newObj = ratelimits;
              newObj[req.ip] = {ratelimited:true,requests:1}
            }
            //* else just add one request
            else{
              newObj = ratelimits;
              newObj[req.ip] = {ratelimited:false,requests:ratelimits[req.ip].requests+1}
            }
          }
          //* add timeout so we can clear it later
          ratelimitTemp[(config.ratelimit.usingCloudflare)?req.headers["cf-connecting-ip"]:req.ip] = {}
          ratelimitTemp[(config.ratelimit.usingCloudflare)?req.headers["cf-connecting-ip"]:req.ip].timeout = setTimeout(function () {
            fs.readFile("./files/ratelimits.json", 'utf8', (err, data) => {
              let r = JSON.parse(data)
              if (config.ratelimit.usingCloudflare) delete r[req.headers["cf-connecting-ip"]]
              else delete r[req.ip]
              fs.writeFileSync("./files/ratelimits.json", JSON.stringify(r))
            })
          }, parseInt(config.ratelimit.ratelimit))
          //* write to file
          fs.writeFileSync("./files/ratelimits.json", JSON.stringify(newObj))
        }

        var key = '';
        for (var i = 0; i < 8; i++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        let someObj;
        fs.readFile("./files/uploaded_files.json", 'utf8', (err, data) => {
          if (err) return res.status(500).send(err)
          someObj = JSON.parse(data)
          someObj[`${name}.${ext}`] = key
          fs.writeFileSync("./files/uploaded_files.json", JSON.stringify(someObj))
        })
        res.status(200).send({
          "url": `/${config.uploadFolder}/${name}.${ext}`,
          "id": name,
          "fname": `${name}.${ext}`,
          "delete": `${name}.${ext}?key=${key}`,
          "deleteURL": `/delete?file=${name}.${ext}&key=${key}`,
          "oldname": `${req.files.file.name}`
        })
      })
    }
  })
})


router.delete("/delete", (req, res) => {
  if (!req.query.key) {
    fs.readFile("./files/uploaded_files.json", 'utf8', (err, data) => {
      let filename = req.body.key.split("?")[0]
      let key = req.body.key.split("?")[1].replace("key=", "")
      let files = JSON.parse(data)
      if (!fs.existsSync(`./public/${config.uploadFolder}/${filename}`)) return res.status(404).send("No file found with that name")
      if (key == files[filename]) {
        fs.unlinkSync(`./public/${config.uploadFolder}/${filename}`)
        delete files[filename]
        fs.writeFileSync(`./files/uploaded_files.json`, JSON.stringify(files))
        res.status(200).send("Deleted")
      } else {
        res.status(401).send("Wrong delete key")
      }
    })
  } else {
    fs.readFile("./files/uploaded_files.json", 'utf8', (err, data) => {
      let filename = req.query.file
      let key = req.query.key
      let files = JSON.parse(data)
      if (!fs.existsSync(`./public/${config.uploadFolder}/${filename}`)) return res.status(404).send("No file found with that name")
      if (key == files[filename]) {
        fs.unlinkSync(`./public/${config.uploadFolder}/${filename}`)
        delete files[filename]
        fs.writeFileSync(`./files/uploaded_files.json`, JSON.stringify(files))
        res.status(200).send("OK")
      } else {
        res.status(401).send("Wrong delete key")
      }
    })
  }
})


module.exports = router;