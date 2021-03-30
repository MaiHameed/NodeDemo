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

async function getPlans(username, role) {
    var conn = await connect();
    var ObjectId = require('mongodb').ObjectID;

    if (role == 'user') {
        
        var user = await conn.collection('users').findOne({ username });
        var planIds = user.financialProfile.plans;
        
        var planNames = await Promise.all(planIds.map(async function(id){
            var plan = await conn.collection('plans').findOne({"_id":ObjectId(id)});
            //return plan.PlanName
            return plan
        }))
        return planNames;

    } else {
        var user = await conn.collection('advisors').findOne({ username });
        var planIds = user.plans;
        
        var planNames = await Promise.all(planIds.map(async function(id) {
            var plan = await conn.collection('plans').findOne({"_id":ObjectId(id)});
            //return plan.PlanName
            return plan
        }))
        return planNames;
    }
}

async function getPlanId(username, planName) {
    var conn = await connect();
    var ObjectId = require('mongodb').ObjectID;
    var user = await conn.collection('users').findOne({ username });
    var planIds = user.financialProfile.plans;
    console.log(planIds)
    var id2 = null
    var id = await Promise.resolve(planIds.forEach( async function(id) {
        var plan = await conn.collection('plans').findOne({"_id":ObjectId(id)});
        if (plan.PlanName == planName) {
            console.log("ID: ",id)
            id2 = id
            return id;
        }
    }));
    console.log(id2);
    return  id;
}
async function getPlanDetails(planID) {
    var conn = await connect();
    var ObjectId = require('mongodb').ObjectID;
    var plan = await conn.collection('plans').findOne({"_id":ObjectId(planID)})
    //console.log(plan)
    return plan

}

function getNames(plans){ //list of plan names
    var names = plans.map(function(plan){
        if (plan != null){
            return plan.PlanName
        }
    })
    return names;
  }
  
function getId(user, plans, planName) { //id of a plan associated with a user
    var id = null
    plans.forEach(function(plan) {
        if (plan.PlanName == planName) {
            console.log("ID: ", plan._id)
            id = plan._id;
        }
    });
    return id;
}
//60639ff045a263d677595d41
//6063707145a263d677595d40
async function deletePlan(username, planID, role) {
    var conn = await connect();
    var ObjectId = require('mongodb').ObjectID;

    if (role == 'user') {
        var user = await conn.collection('users').findOne({ username });
        console.log(user)
        console.log(planID)
        var planIds = user.financialProfile.plans;
        var i = planIds.indexOf(planID.toString())
        if (i > -1) {
            planIds.splice(i,1)
        }
        const filter = { _id: user._id };
        const updateDocument = {
            $set: {
                financialProfile: {
                    plans: planIds, //[ '6061ede581737cf549fecb5c', '6061ee4481737cf549fecb5d' ],
                    pendingPlans: user.financialProfile.pendingPlans,
                    totalFunds: user.financialProfile.totalFunds,
                },
            },
        };
        const result = await conn.collection('users').updateOne(filter, updateDocument);
    } else {
        var user = await conn.collection('advisors').findOne({ username });
        console.log(user)
        console.log(planID)
        var planIds = user.plans;
        var i = planIds.indexOf(planID.toString())
        if (i > -1) {
            planIds.splice(i,1)
        }
        const filter = { _id: user._id };
        const updateDocument = {
            $set: {
                plans: planIds, //[ '6061ede581737cf549fecb5c', '6061ee4481737cf549fecb5d' ],
            },
        };
        const result = await conn.collection('advisors').updateOne(filter, updateDocument);
    }
    
    
    //var plan = await conn.collection('plans').deleteOne({"_id":ObjectId(planID)});
}

async function sendPlan(username, planID) {
    var conn = await connect();
    var ObjectId = require('mongodb').ObjectID;

    var user = await conn.collection('users').findOne({ username });
    var planIds = user.financialProfile.plans;
    planIds.push(planID)

    const filter = { _id: user._id };
    const updateDocument = {
        $set: {
            financialProfile: {
                plans: planIds, //[ '6061ede581737cf549fecb5c', '6061ee4481737cf549fecb5d' ],
                pendingPlans: user.financialProfile.pendingPlans,
                totalFunds: user.financialProfile.totalFunds,
            },
        },
    };
    const result = await conn.collection('users').updateOne(filter, updateDocument);

}

//deletePlan("yas", 6063707145a263d677595d40)

//sendPlan("joe", "123456")
//deletePlan("joe", 6061ede581737cf549fecb5c)
// register('yas', 'pass');
// login('yas', 'pass')
// addListItem("yas", "test Item")
// deleteListItems("yas", "test Item");
// getListItems("yas");

//getPlans('joe').then(data => {console.log(data); return data})


// x.then(function(result) {
//     console.log(result) // "Some User token"
//  })

//getPlanDetails('6061ede581737cf549fecb5c');

//var t = getPlanId("joe", "plan11").then(data => {console.log("DATA: ", data); return data})
// console.log("TTTT: ", t)

module.exports = {
    url,
    login,
    register,
    getPlans,
    getId,
    getNames,
    getPlanDetails,
    deletePlan,
    sendPlan,
    getFunds,
    deleteProfile,
    getName
};