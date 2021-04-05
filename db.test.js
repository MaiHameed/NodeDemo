var db = require("./db");

test('Register and login - user', async function(){
    await db.register('testName', 'testUser', 'testPass', 'user') //name, username, password, role
    await db.login('testUser', 'testPass')

    await db.deleteProfile('testUser')
});

test('Register and login - advisor', async function(){
    await db.register('testName', 'testAdv', 'testPass', 'advisor') //name, username, password, role
    await db.login('testAdv', 'testPass')

    await db.deleteProfile('testAdv')
});