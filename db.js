console.log("hello there");
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

async function register(username, password) {
    var conn = await connect(); // establish connection with database
    var exsitingUser = await conn.collection('users').findOne({ username }); // pull from collection

    if (exsitingUser != null) {
        throw new Error('User Exists!')
    }

    var SALT_ROUNDS = 10; // recomended value for hashing
    var passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await conn.collection('users').insertOne({ username, passwordHash })
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

async function getPlans(username) {
    var conn = await connect();
    var ObjectId = require('mongodb').ObjectID;
    var user = await conn.collection('users').findOne({ username });
    var planIds = user.financialProfile.plans;
    
    var planNames = await Promise.all(planIds.map(async function(id){
        var plan = await conn.collection('plans').findOne({"_id":ObjectId(id)});
        //return plan.PlanName
        return plan
    }))
    return planNames;
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
      return plan.PlanName
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

async function deletePlan(username, planID) {
    var conn = await connect();
    var ObjectId = require('mongodb').ObjectID;

    var user = await conn.collection('users').findOne({ username });
    var planIds = user.financialProfile.plans;
    var i = planIds.indexOf(planID)
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
    
    var plan = await conn.collection('plans').deleteOne({"_id":ObjectId(planID)});
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

//sendPlan("joe", "123456")
//deletePlan("joe", "6061ede581737cf549fecb5c")
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
    addListItem,
    deleteListItems,
    getListItems,
    getPlans,
    getId,
    getNames,
    getPlanDetails,
    deletePlan,
    sendPlan,
};