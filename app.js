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
    if (sess.email){ // Check if the email is present
        res.send(`<div align ='center'><h2>You are already logged in!</h2></div><br><br><br><div align ='center'><h3>Your email is: ${sess.email}</h3></div><br><br><div align='center'><a href=\'/logout'>click to logout</a></div>`);
    }
    else{
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
                res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./register.html'>Register another user</a></div>");
            } else {
                res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./register.html'>Register again</a></div>");
            }
        } catch{
            res.send("Internal server error");
        }
    }
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
                res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${sess.username}</h3></div><br><br><div align='center'><a href=\'/logout'>click to logout</a></div>`);
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

app.get('/logout', async(req, res) =>{
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
    return res.redirect('/');
});

server.listen(3000, function(){
    console.log("server is listening on port: 3000");
});