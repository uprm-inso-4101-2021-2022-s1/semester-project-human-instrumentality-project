const express = require('express');
const session = require('express-session');
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;
const e = require('express');

const app = express();
const server = http.createServer(app);

// Global Session: not reccommended and TEMPORARY
var sess;

app.use(session({
  
    // It holds the secret key for session
    secret: 'Your_Secret_Key',
  
    // Forces the session to be saved
    // back to the session store
    resave: true,
  
    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: true
}))
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./HIP Website')));

app.get('/', function(req,res) {
    sess = req.session;
    res.sendFile(path.join(__dirname,'./HIP Website/index.html'));
});

app.post('/register', async (req, res) => {
    sess = req.session;
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (!foundUser) {
    
            let hashPassword = await bcrypt.hash(req.body.password, 10);
    
            let newUser = {
                id: Date.now(),
                username: req.body.username,
                email: req.body.email,
                passwordEncrypted: hashPassword,
                password: req.body.password
            };
            users.push(newUser);
            console.log('User list', users);
            res.redirect("/registrationSuccessful.html");
        } else {
            res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./register.html'>Register again</a></div>");
        }
    } catch{
        res.send("Internal server error");
    }
    
});

app.post('/loginAsGuest', async(req,res) =>{
    const id = Date.now();
    sess.username = "Guest#" + id;
    res.redirect("/play.html");
});

app.post('/login', async (req, res) => {
    sess = req.session;
    try{
        let foundUser = users.find((data) => req.body.username === data.username);
        if (foundUser) {
    
            let submittedPass = req.body.password; 
            let storedPass = foundUser.passwordEncrypted; 
    
            const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
            if (passwordMatch) {
                sess.username = foundUser.username;
                sess.email = foundUser.email;
                res.redirect("/loginSuccessful.html");
            } else {
                res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
            }
        }
        else {
    
            let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
            await bcrypt.compare(req.body.password, fakePass);
    
            res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

app.post('/logout', async(req, res) =>{
    sess = req.session;

    // For testing. 
    if (sess.username){
        console.log("Goodbye " + req.session.username);
    }

    else{
        console.log("User isn't logged in!");
    }

    // Destroy the session, and redirect to the main page
    sess.destroy();
    res.redirect('/index.html');
});

//When the user clicks the play button, depening if they are logged in or not they will be redirected to play page or login page respectively.
app.post('/play', async(req, res) =>{
    sess = req.session;
    try{
        if(sess.username){
            console.log("User is logged in, redirecting to play page");
            res.redirect("/play.html");
        }
        else {
            console.log("User is not logged in, redirecting to log in page")
            res.redirect("/login.html");
        }
    }
    catch{
        console.log("Whoops! hehe");
    }


});

server.listen(3000, function(){
    console.log("server is listening on port: 3000");
});