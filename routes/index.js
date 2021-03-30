const connectMongo = require('connect-mongo');
var express = require('express');
const { response } = require('../app');
var router = express.Router();
var db = require("../db")

// User login page
router.get('/login', async function(req, res) { // renders a given hbs for given endpoint
  res.render('login', { title: 'Login'});
});

router.post('/login', async function(req, res) { // renders a given hbs for given endpoint
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
  }else{
    res.status(500).end();
  }
});

module.exports = router;