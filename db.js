var { MongoClient } = require("mongodb");
var bcrypt = require("bcrypt"); //for password auth
var url = "mongodb+srv://dbUser:dbPassword@cluster0.rdapr.mongodb.net/cps888?retryWrites=true&w=majority";

var db = null;
async function connect() {
    if (db == null) {
        var options = {useUnifiedTopology: true};

        var connection = await MongoClient.connect(url, options);
        connection.db("cps888");

        db = await connection.db("cps888");
    }

    return db;
}

async function register(username, password, role) {
    var conn = await connect(); // establish connection with database
    var exsistingUser = await conn.collection('users').findOne({ username }); // pull from collection

    if (exsistingUser != null) {
        throw new Error('User Exists!')
    }

    var SALT_ROUNDS = 10; // recomended value for hashing
    var passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await conn.collection('users').insertOne(
            { 
                username, 
                passwordHash, 
                role,
                funds: 0 
            }
        )
}

async function login(username, password) {
    var conn = await connect();
    var user = await conn.collection('users').findOne({ username });

    if (user == null) {
        throw new Error('User does not exsist')
    }

    var valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) { 
        throw new Error("Invalid Password");
    }

    console.log("Login Successful!")
}
console.log(getFunds("mai5"))
async function getFunds(username){
    var conn = await connect();
    const doc = await conn.collection('users')
                            .findOne({ username: username })
    return doc.funds;
}

/*
async function addListItem(username, item) {
    var conn = await connect();

    await conn.collection('users').updateOne(
        { username },
        {
            $push: {
                list: item,
            }
        }
    )
}

async function getListItems(username) {
    var conn = await connect();
    var user = await conn.collection('users').findOne({ username });

    console.log("List items:", user.list);

    return user.list;
}

async function deleteListItems(username, item) {
    var conn = await connect();
    await conn.collection('users').updateOne(
       { username },
       {
           $pull: {
               list: item,
           }
       } 
    )
}
*/

module.exports = {
    url,
    login,
    register,
    getFunds
};