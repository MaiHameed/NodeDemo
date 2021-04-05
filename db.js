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

async function register(name, username, password, role) {
    var conn = await connect(); // establish connection with database
    var SALT_ROUNDS = 10; // recomended value for hashing
    var passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const exsistingUser = await conn.collection('users').findOne({ username }); // pull from collection
    const exsistingAdvisor = await conn.collection('advisors').findOne({ username });

    if(exsistingUser != null || exsistingAdvisor != null){
        throw new Error("Username already taken!");
    }

    if(role == 'user'){
        await conn.collection('users').insertOne(
            { 
                name,
                username, 
                passwordHash, 
                financialProfile: {
                    plans : [],
                    pendingPlans : [],
                    totalFunds : 0
                }
            }
        )
    }else{
        await conn.collection('advisors').insertOne(
            { 
                name,
                username, 
                passwordHash,
                plans: [],
                advisorType : "Budget Planner" 
            }
        )
    }
}

async function login(username, password) {
    var conn = await connect();
    var user = await conn.collection('users').findOne({ username });
    var advisor = await conn.collection('advisors').findOne({ username });

    if (user == null && advisor == null) {
        throw new Error('Profile does not exsist!');
    }else if(user == null){
        var valid = await bcrypt.compare(password, advisor.passwordHash);
        var role = 'advisor';
    }else{
        var valid = await bcrypt.compare(password, user.passwordHash);
        var role = 'user';
    }

    if (!valid) { 
        throw new Error("Invalid Password");
    }
    console.log("Login Successful!");
    return role;
}

async function getFunds(username){
    var conn = await connect();
    const doc = await conn.collection('users')
                            .findOne({ username: username })
    return doc.financialProfile.totalFunds;
}

async function getName(username){
    var conn = await connect();
    var user = await conn.collection('users').findOne({ username });
    var advisor = await conn.collection('advisors').findOne({ username });

    if (user == null && advisor == null) {
        throw new Error('Username: '+username+' does not have a profile!');
    }else if(user == null){
        const doc = await conn.collection('advisors')
                                .findOne({ username });
        return doc.name;
    }else{
        const doc = await conn.collection('users')
                                .findOne({ username });
        return doc.name;
    }
}

async function deleteProfile(username){
    var conn = await connect();
    await conn.collection('users').deleteOne({ username: username });
    await conn.collection('advisors').deleteOne({ username: username });
    return 0
}

async function addFunds(username, amount){
    var conn = await connect();

    var existingFunds = await getFunds(username);
    console.log(existingFunds);
    // console.log("input amount: "+ amount)
    newAmount = +existingFunds + +amount;
    // console.log("new funds"+ newAmount);
    await conn.collection('users').updateOne(
        {username},
        {
            $set:{
                "financialProfile.totalFunds": newAmount,
            }
        }
    )
    console.log(await getFunds(username))
}

async function addFunds(username, amount){
    var conn = await connect();

    var existingFunds = await getFunds(username);
    console.log(existingFunds);
    // console.log("input amount: "+ amount)
    newAmount = +existingFunds + +amount;
    // console.log("new funds"+ newAmount);
    if (isNaN(existingFunds)){
        await conn.collection('users').updateOne(
            {username},
            {
                $set:{
                    "financialProfile.totalFunds": 0,
                }
            }
        )
    }else{
        await conn.collection('users').updateOne(
            {username},
            {
                $set:{
                    "financialProfile.totalFunds": newAmount,
                }
            }
        )
    }
    console.log(await getFunds(username))
}

async function removeFunds(username, amount){
    var conn = await connect();
    var invalid;
    var existingFunds = await getFunds(username);
    console.log(existingFunds);
    if (isNaN(existingFunds)){
        await conn.collection('users').updateOne(
            {username},
            {
                $set:{
                    "financialProfile.totalFunds": 0,
                }
            }
        )
    }else{    
        newAmount = +existingFunds - +amount;
        // console.log("new funds"+ newAmount);
        await conn.collection('users').updateOne(
            {username},
            {
                $set:{
                    "financialProfile.totalFunds": newAmount,
                }
            }
        )
    }
    console.log(await getFunds(username));    
}

module.exports = {
    url,
    login,
    register,
    getFunds,
    deleteProfile,
    getName,
    addFunds,
    removeFunds,
};