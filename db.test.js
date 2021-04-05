const { ExpectationFailed } = require("http-errors");
var db = require("./db");

// beforeAll(async function() {
//     await db.wipe();
// })

test('Register and login - user', async function(){
    await db.register('testName', 'testUser', 'testPass', 'user') //name, username, password, role
    await db.login('testUser', 'testPass')

});

test('Register and login - advisor', async function(){
    await db.register('testName', 'testAdv', 'testPass', 'advisor') //name, username, password, role
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

test('Delete Profile - User', async function(){
    await db.deleteProfile('testUser')
});

test('Delete Profile - Advisor', async function(){
    await db.deleteProfile('testAdv')
});

afterAll(async function(){
    db.close();
});