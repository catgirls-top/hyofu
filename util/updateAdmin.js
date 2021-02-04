const bcrypt = require("bcrypt")
const fs = require("fs")
let rl = require("readline-sync")
let admin = {}

function user() {
    let ans = rl.question('Enter desired username: ')
    if (!/[a-zA-Z0-9_-]+/.test(ans)) {
        console.log("Username should only contain letters a-z, A-Z, numbers, underscores and dashes")
        rl.close()
        user()
        return;
    }
    admin.user = ans
    pass()
}

async function pass(){
    let ans = rl.question('Enter desired password: ')
    admin.pass = await bcrypt.hash(ans,8)
    save()
}

function save(){
    let json = JSON.parse(fs.readFileSync("./config.json"))
    json.admin=admin
    fs.writeFileSync("./config.json",JSON.stringify(json))
    return;
}
user()
