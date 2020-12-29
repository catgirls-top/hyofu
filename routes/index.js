var express = require('express');
var router = express.Router();
var config = require("../config.json")
const fs = require("fs")
const os = require("os")
const path = require("path")

router.get('/', function (req, res, next) {
  res.render('index');
});

router.post('/upload', (req, res) => {
  let ratelimits
  fs.readFile("./files/ratelimits.json", 'utf8', (err, data) => {
    if (err) return res.status(500).send(err)
    ratelimits = JSON.parse(data)
    if (!req.files) return res.status(400).send("No file")
    if ((config.ratelimit.usingCloudflare) ? ratelimits[req.headers["cf-connecting-ip"]] == true : ratelimits[req.ip] == true) return res.status(403).set("RateLimit-Limit", `1r/${config.ratelimit.ratelimit}ms`).send("You are being rate-limited")
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

        if (config.ratelimit.allowRatelimits) {
          let newObj = ratelimits;
          if (config.ratelimit.usingCloudflare) newObj[req.headers["cf-connecting-ip"]] = true
          else newObj[req.ip] = true
          fs.writeFileSync("./files/ratelimits.json", JSON.stringify(newObj))
          setTimeout(function () {
            fs.readFile("./files/ratelimits.json", 'utf8', (err, data) => {
              let r = JSON.parse(data)
              if (config.ratelimit.usingCloudflare) delete r[req.headers["cf-connecting-ip"]]
              else delete r[req.ip]
              fs.writeFileSync("./files/ratelimits.json", JSON.stringify(r))
            })
          }, parseInt(config.ratelimit.ratelimit))
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
          "url": `${req.hostname}/${config.uploadFolder}/${name}.${ext}`,
          "id": name,
          "delete": `${name}.${ext}?key=${key}`,
          "deleteURL": `${req.hostname}/delete/?file=${name}.${ext}&key=${key}`
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
    let filename = req.query.file
    let key = req.query.key
    let files = JSON.parse(data)
    if (key == files[filename]) {
      fs.unlinkSync(`./public/${config.uploadFolder}/${filename}`)
      fs.writeFileSync(`./files/uploaded_files.json`, JSON.stringify(files))
      res.status(200).send("Deleted")
    } else {
      res.status(401).send("Wrong delete key")
    }
  }
})

module.exports = router;
