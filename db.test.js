const { ExpectationFailed } = require("http-errors");
var db = require("./db");

// beforeAll(async function() {
//     await db.wipe();
// })

test('Register and login - user', async function(){
    await db.register('testName', 'testUser', 'testPass', 'user') 
    await db.login('testUser', 'testPass')

});

test('Register and login - advisor', async function(){
    await db.register('testName', 'testAdv', 'testPass', 'advisor') 
    await db.login('testAdv', 'testPass')
});

test('Get Funds', async function(){
    var funds = await db.getFunds("testUser")
    expect(funds).toBe(0)
});

test('Add Funds', async function(){
    await db.addFunds('testUser', 100)
    var funds = await db.getFunds('testUser')
    expect(funds).toBe(100)
});

test('Get name - user', async function(){
    var name = await db.getName('testUser')
    expect(name).toBe('testName')
});

test('Get name - advisor', async function(){
    var name = await db.getName('testAdv')
    expect(name).toBe('testName')
});

test('Add plan - user', async function(){
    await db.addPlan('testUser', 'user', "testPlan", "2020-01-01", "2021-01-01")
});

test('Add plan - advisor', async function(){
    await db.addPlan('testAdv', 'advisor', "testPlan", "2020-01-01", "2021-01-01")
});

test('Add category', async function(){
    await db.addCategory('testUser', 'user', 100, 50)
});

test('Send plan', async function(){
    var plans = await db.getPlans('testAdv', 'advisor')
    var planId = await db.getId('testAdv', plans, 'testPlan')
    db.sendPlan('testUser', planId)
});

test('Delete Profile - User', async function(){
    await db.deleteAccount('testUser')
});

test('Delete Profile - Advisor', async function(){
    await db.deleteAccount('testAdv')
});

afterAll(async function(){
    db.close();
});