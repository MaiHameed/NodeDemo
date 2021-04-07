const connectMongo = require('connect-mongo');
var express = require('express');
const { Logger } = require('mongodb');
const { response } = require('../app');
var router = express.Router();
var db = require("../db")

// User login page
router.get('/login', async function(req, res) { // renders a given hbs for given endpoint
  res.render('login', { title: 'Login'})
});

router.post('/login', async function(req, res) { 
  var {
    username,
    password,
    login,
    register
  } = req.body;

  if(register){
    res.redirect('/register');
  }else if(login){
    var role = await db.login(username, password);
    req.session.username = username;
    req.session.role = role;
    res.redirect('/');
  }
});

router.post('/register', async function(req, res) {
  var { name,
        username, 
        password, 
        role } = req.body; // these values coming from login.hbs file

  await db.register(name, username, password, role);
  req.session.username = username;
  req.session.role = role;
  console.log(role);
  res.redirect('/');
});

router.get('/register', async function(req,res){
  res.render('register');
})

// Protects pages, call this on all pages you want to protect (all pages except the login/register pages above)
function ensureLoggedIn(req, res, next) { // ensure pages cant be accessed until logged in
  if (!req.session.username) { //if no recorded username in session
    res.redirect('/login')
  } else {
    next(); //got to next page
  }
}

router.get('/', ensureLoggedIn, async function(req, res){
  const username = req.session.username;
  const role = req.session.role;
  console.log(role);
  var isUser;
  if (role == 'user'){
    isUser = true;
    res.render('accountOverview', { 
      fullName: await db.getName(username),
      username,
      isUser,
      funds: await db.getFunds(username)
    });
  } else {
    isUser = false;
    res.render('accountOverview', { 
      fullName: await db.getName(username),
      username,
      isUser
    });
  }
});

router.get('/logout', ensureLoggedIn, async function(req, res) {
  req.session.username = '';
  req.session.role = '';
  res.status(200).end();
});

router.delete('/deleteProfile/:username', ensureLoggedIn, async function(req, res) {
  const response = await db.deleteProfile(req.params.username);
  if(!response){
    res.status(200).end();
  } else{
    res.status(500).end();
  }
});

router.get('/plans', ensureLoggedIn, async function(req, res) {
  var { username } = req.session;
  const role = req.session.role;
  var isUser;
  if (role == 'user') {
    isUser = true;
  } else {
    isUser = false;
  }
  
  var plans = await db.getPlans(username, role)
  var names = db.getNames(plans)
  
  res.render('plans', { 
    username,
    items: names,
    user: isUser, 
    viewPending: false,
  }); 
});


router.post('/plans', ensureLoggedIn, async function(req, res) {
  var { username } = req.session;
  const role = req.session.role;
  var isUser;
  if (role == 'user') {
    isUser = true;
  } else {
    isUser = false;
  }

  if (req.body.view) { // check condition based on the existance of the delete  variable
    console.log("VIEW")
    var planName = req.body.view
    var plans = await db.getPlans(username, req.session.role)
    var planID = db.getId(username, plans, planName)
    var plan = await db.getPlanDetails(planID)
    
    res.render('budget', {
      name: plan.PlanName, 
      start: plan.StartDate, 
      end: plan.EndDate, 
      total: plan.totalSpent, 
      categories: plan.categories, 
      isUser: isUser
    });
  
  } else if (req.body.edit) {
    // ola
    console.log("EDIT")
    var planName = req.body.edit

  } else if (req.body.delete) {
    console.log("DELETE")
    var planName = req.body.delete
    var plans = await db.getPlans(username, req.session.role)
    var planID = db.getId(username, plans, planName)
    
    await db.deletePlan(username, planID, role)
    res.redirect('/plans')

  } else if (req.body.home) {
    res.redirect('/account')
  } 
  else if (req.body.back) {
    res.redirect('/plans')
  } 
});

router.get('/send/:planName/:person', ensureLoggedIn, async function(req, res) {
  var { username } = req.session;
  const planName = req.params.planName;
  const person = req.params.person;
  var plans = await db.getPlans(username, "advisor");
  var planID = db.getId(username, plans, planName);

  await db.sendPlan(person, planID);
  res.status(200).end();
});

router.get('/deletePln/:planName', ensureLoggedIn, async function(req, res) {
  var { username } = req.session;
  const planName = req.params.planName;
  
  var plans = await db.getPlans(username, req.session.role)

  var planID = db.getId(username, plans, planName)
  //console.log('HERRE')

  await db.deletePlan(username, planID, role)
  // console.log('HERRE')

  res.status(200).end();

});

router.get('/pendingPlans', ensureLoggedIn, async function(req, res) {
  var { username } = req.session;
  var plans = await db.getPendingPlans(username)
  var names = db.getNames(plans)
  
  res.render('plans', { 
    username,
    items: names,
    user: true,
    viewPending: true,
  }); 

});

router.post('/pendingPlans', ensureLoggedIn, async function(req, res) {
  var { username } = req.session;
  const role = req.session.role;
  var isUser;
  if (role == 'user') {
    isUser = true;
  } else {
    isUser = false;
  }

  if (req.body.view) { 
    console.log("VIEW")
    var planName = req.body.view
    var plans = await db.getPendingPlans(username)
    var planID = db.getId(username, plans, planName)
    var plan = await db.getPlanDetails(planID)

    res.render('budget', {
      name: plan.PlanName, 
      start: plan.StartDate, 
      end: plan.EndDate, 
      total: plan.totalSpent, 
      categories: plan.categories, 
      user: isUser
    });
  
  } else if (req.body.delete) {
    console.log("DELETE")
    var planName = req.body.delete
    var plans = await db.getPendingPlans(username)
    var planID = db.getId(username, plans, planName)

    await db.deletePendingPlan(username, planID)
    res.redirect('/pendingPlans')

  } else if (req.body.accept) {
    console.log("ACCEPT")
    var planName = req.body.accept;
    var plans = await db.getPendingPlans(username, 'user')
    var planID = db.getId(username, plans, planName)

    await db.acceptPlan(username, planID)
    res.redirect('/pendingPlans')

  }
  else if (req.body.home) {
    res.redirect('/account')
  } 
  else if (req.body.back) {
    res.redirect('/pendingPlans')
  } 
});
router.get('/account', ensureLoggedIn, async function(req, res){
  const username = req.session.username;
  const role = req.session.role;
  var isUser;
  if (role == 'user'){
    isUser = true;
    res.render('account-options', {
      title: 'Account Options',
      funds : await db.getFunds(username),
      isUser
  });
    
  }else{
    isUser = false;
    res.render('account-options', {
      title: 'Account Options',
      isUser
    });
  }
  
});

router.post('/account', ensureLoggedIn, async function(req, res){
  var{
    addDollars,
    remDollars,
    add,
    remove,
  } = req.body;
  const username = req.session.username;
  var money = await db.getFunds(username);
  var invalid;
  
  if(add){
      if(parseInt(addDollars) >= 0){
        await db.addFunds(username, addDollars);
        res.redirect('/account');
      } else{
        console.log("invalid add amount entered.")
      }
  } else if (remove){
      console.log(remDollars);
      console.log(money);
      if(parseInt(remDollars) <= parseInt(money)){
        invalid=false;
        await db.removeFunds(username, remDollars);
        res.redirect('/account');
      } else {
        console.log("invalid remove amount entered.");
      }
  }
});

module.exports = router;