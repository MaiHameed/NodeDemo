const connectMongo = require('connect-mongo');
var express = require('express');
const { response } = require('../app');
var router = express.Router();
var db = require("../db")

// User login page
router.get('/login', async function(req, res) { // renders a given hbs for given endpoint
  res.render('login', { title: 'Login'})
});


router.post('/login', async function(req, res) {
  var { username, 
        password, 
        role, 
        register } = req.body; // these values coming from login.hbs file

  if (register) {
    console.log('Registering ', username, ' as ', role);
    await db.register(username, password, role) // these are functions in db
  } else {
    await db.login(username, password)
  }

  req.session.username = username; //adds username as a cookie
  res.redirect('/'); //redirect to homepage
});

function ensureLoggedIn(req, res, next) { // ensure pages cant be accessed until logged in
  if (!req.session.username) { //if no recorded username in session
    res.redirect('/login')
  } else {
    next(); //got to next page
  }
}

router.use(ensureLoggedIn);

router.get('/', async function(req, res){
  var { username } = req.session;
  res.render('userHome', { 
    username,
    funds: await db.getFunds(username)
    //items: await db.getListItems(username), 
  }); //replaces username in index file
});

router.post('/', async function(req, res) {
  var { goToAccount, 
    deleteProfile, 
    logout } = req.body; // from userHome.hbs

  if (goToAccount) {
    //res.redirect('/account');
  } else if (deleteProfile) {
    //res.redirect('/deleteUser');
  } else if (logout) {
    res.redirect('/logout');
  } else {
    res.redirect('/');
  }
});

router.get('/logout', async function(req, res) {
  req.session.username = '';
  res.redirect('/')
});

module.exports = router;