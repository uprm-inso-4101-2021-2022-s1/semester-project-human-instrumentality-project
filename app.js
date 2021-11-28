// Config
const http = require('http');
const path = require('path');

// Middleware
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieparser = require('cookie-parser');
const bcrypt = require('bcrypt');
const database = require('./models/db');
const app = express();
const server = http.createServer(app);
const User = require('./models/user');

//----------------------EVERYTHING RELATED TO THE LOBBIES-----------------------------
//(These could maybe be moved to a different file eventually to avoid having such a big "app.js")

/* 
All games should define:
  createLobbySuccess(lobby): Emitted when a lobby was created successfully
  noLobbyFound(): Emitted when no lobby was found
  lobbyFound(lobby): Emitted when a lobby was found
  joined(lobby): Emitted when a lobby was joined successfully
  failedToJoin(lobby): Emitted when the user was not able to join the lobby
  joinedSuccessfully(lobby): Emitted when the player was able to join the lobby
  actionFound(fullAction): Emitted when the subaction is found in the database
*/

const { MongoClient } = require('mongodb');
const io = require('socket.io')(server);
const cors = require('cors');
const client = new MongoClient(process.env.MONGO_URI); //we actually have to remove the .env file from the github for security purposes***

app.use(cors());

let lobbies;
let currentLobby;

async function findLobbyByID(lobbyId) {
	return lobbies.findOne({ _id: lobbyId });
}

function lobbyIsFull(lobby) {
	if (lobby) {
		if (!lobby.players) return false;
		return lobby.players.length === lobby.maxPlayers;
	}
	return true;
}

io.on('connection', async (socket) => {
	// Called when the user wants to create a new lobby
	socket.on('createLobby', async (id, gameName, maxPlayers) => {
		// Create a lobby and insert it to the lobbies variable
		console.log('Creating new lobby for: ' + gameName);

		lobbies
			.insertOne({
				_id: id,
				gameName: gameName,
				maxPlayers: maxPlayers,
			})
			.then((doc) => {
				// Let the game define what should happen after the lobby is created
				findLobbyByID(id).then((lobby) =>
					socket.emit('createLobbySuccess', lobby)
				);
			});
	});

	// Called when the user wants to find an available lobby
	// for their specific game (RPS, Blackjack, etc)
	socket.on('findAvailableLobby', async (gameName) => {
		let foundLobby;

		await lobbies.find().forEach(function (lobby) {
			if (!lobbyIsFull(lobby) && lobby.gameName === gameName) {
				foundLobby = lobby;
			}
		});

		if (!foundLobby) {
			// No lobby found. Game should create a new lobby and join it
			socket.emit('noLobbyFound');
		}

		// Lobby was found. Give the lobby to the game
		else {
			socket.emit('lobbyFound', foundLobby);
		}
	});

	// Called when the user wants to join an available lobby
	socket.on('joinLobby', async (id, player) => {
		let lobby = await findLobbyByID(id);
		console.log(`${sess.username} is trying to join lobby: ${id}`);

		// TEMP: Assign the username to the user
		player.username = sess.username;
		if (lobbyIsFull(lobby)) {
			console.log(`Cannot join lobby ${id} because it is full`);
			socket.emit('failedToJoin', lobby);
		} else {
			lobbies
				.updateOne(
					{ _id: id },
					{
						$push: { players: player },
					}
				)
				.then((doc) => {
					// The socket should join the updated lobby
					findLobbyByID(id).then((lobby) => {
						socket.join(id);
						currentLobby = lobby;
						socket.emit('joinedSuccessfully', currentLobby);
					});
				});
		}
	});

	socket.on('waitUntilFull', async (id) => {
		try {
			let lobby;
			console.log('Waiting for more players...');
			while (!lobbyIsFull(lobby)) {
				//this loop runs on the background searching for more players
				lobby = await findLobbyByID(id);
			}
		} catch (e) {
			console.log(
				'Lobby was most likely deleted, searching for players failed.'
			);
		}
	});

	socket.on('addAction', (action) => {
		lobbies
			.updateOne(
				{ _id: currentLobby._id },
				{ $push: { actions: action } }
			)
			.then((doc) => io.to(currentLobby._id).emit('action', action));
	});

	socket.on('waitForAction', async (lobbyId, subAction) => {
		let foundAction;
		try {
			while (!foundAction) {
				//this loop essentially runs until the subaction is found, or someone leaves the lobby
				await lobbies.findOne({ _id: lobbyId }).then((lobby) => {
					if (lobby && lobby.actions) {
						lobby.actions.forEach((a) => {
							console.log(a);
							console.log(subAction);
							console.log("====");
							if (a.includes(subAction)) {
								foundAction = a;
							}
						});
					}
				});
			}

			socket.emit('actionFound', action);
		} catch (e) {
			console.log(
				'Lobby was most likely deleted, searching for actions failed.'
			);

			console.log(e);
		}
	});

	socket.on('removeAction', async (id, action) => {
		lobbies.updateOne({ _id: id }, { $pull: { actions: action } });
	});

	socket.on('disconnect', (socket) => {
		//for now, I made it such that if a player leaves, the lobby is removed
		//this emit is called automatically after the user closes the tab*
		console.log('Disconnected');
		if (currentLobby) {
			let id = currentLobby._id;
			lobbies
				.deleteOne({ _id: id })
				.then(console.log(`Disconnected from room with ID: ${id}`));
		}
	});
});
//-----------------------END OF EVERYTHING RELATED TO THE LOBBIES---------------------------

// Global Session: not recommended and TEMPORARY
var sess;

app.set('views', path.join(__dirname, 'HIP Website/views'));
app.set('view engine', 'ejs');
app.use(
	session({
		// It holds the secret key for session
		secret: 'Your_Secret_Key',

		// Forces the session to be saved
		// back to the session store
		resave: true,

		// Forces a session that is "uninitialized"
		// to be saved to the store
		saveUninitialized: true,
	})
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'HIP Website')));
app.use(cookieparser());

// Functions

// Redirect user to the parameter page and passes in the session username
// if present
function redirectToPageWithHeader(req, res, page) {
	sess = req.session;
	if (sess.username) {
		res.render(page, { username: sess.username });
	} else {
		res.render(page, { username: '' });
	}
}

// Redirects user to the page only if they are logged in
// or the user has a cookie present.
// Otherwise redirect to login page.
function redirectIfLoggedIn(req, res, pageIfLoggedIn) {
	sess = req.session;
	let pageToGoTo = pageIfLoggedIn;
	let username = req.cookies.username;

	if (sess.username) {
	}
	// If the user has a cookie present, log them in!
	else if (username) {
		console.log('Logging in as user: ' + username);
		updateSession(sess, username, req.cookies.email);
	} else {
		pageToGoTo = 'login';
		console.log('User is not logged in, redirecting to log in page');
	}
	redirectToPageWithHeader(req, res, pageToGoTo);
}

function updateSession(session, username, email) {
	session.username = username;
	session.email = email;
}

// EJS Page Redirection
// Try to keep them in alphabetical order!
// Also exclude partials pages!
app.get('/', async (req, res) => {
	res.redirect('/index');
});

app.get('/aboutus', async (req, res) => {
	redirectToPageWithHeader(req, res, 'aboutus');
});

app.get('/avatarSelection', async (req, res) => {
	redirectIfLoggedIn(req, res, 'avatarSelection');
});

app.get('/faq', async (req, res) => {
	redirectToPageWithHeader(req, res, 'faq');
});

app.get('/forgotPassword', async (req, res) => {
	redirectToPageWithHeader(req, res, 'forgotPassword');
});

app.get('/index', async (req, res) => {
	redirectToPageWithHeader(req, res, 'index');
});

app.get('/login', async (req, res) => {
	redirectToPageWithHeader(req, res, 'login');
});

app.get('/play', async (req, res) => {
	redirectIfLoggedIn(req, res, 'play');
});

app.get('/profile', async (req, res) => {
	redirectIfLoggedIn(req, res, 'profile');
});

app.get('/register', async (req, res) => {
	redirectToPageWithHeader(req, res, 'register');
});

app.get('/resetPassword', async (req, res) => {
	redirectToPageWithHeader(req, res, 'resetPassword');
});

// POST methods
app.post('/register', async (req, res) => {
	sess = req.session;
	try {
		const emailInUse = await User.isThisEmailInUse(req.body.email);
		const userNameInUse = await User.isThisUserNameInUse(req.body.username);

		if (!emailInUse && !userNameInUse) {
			let hashPassword = await bcrypt.hash(req.body.password, 10);
			const user = await User({
				username: req.body.username,
				email: req.body.email,
				password: hashPassword,
			});

			await user.save();
			res.redirect('/registrationSuccessful.html');
		} else {
			res.send(
				"<div align ='center'><h2>Email or username already used</h2></div><br><br><div align='center'><a href='./register.html'>Register again</a></div>"
			);
		}
	} catch {
		res.send('Internal server error');
	}
});

app.post('/loginAsGuest', async (req, res) => {
	const id = Date.now();
	sess.username = 'Guest#' + id;
	res.redirect('/play');
});

app.post('/login', async (req, res) => {
	sess = req.session;
	try {
		const userNameInUse = await User.isThisUserNameInUse(req.body.username);

		if (userNameInUse) {
			let usernamePassed = req.body.username;
			let passwordPassed = req.body.password;

			const user = await User.findOne({ username: usernamePassed });
			const passwordsMatch = await user.passwordsMatch(passwordPassed);
			if (passwordsMatch) {
				updateSession(sess, user.username, user.email);

				if (req.body.remember) {
					res.cookie('username', sess.username);
					res.cookie('email', sess.email);
				}
				res.redirect('/loginSuccessful.html');
			} else {
				res.send(
					"<div align ='center'><h2>Invalid username or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>"
				);
			}
		} else {
			res.send(
				"<div align ='center'><h2>Invalid username or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>"
			);
		}
	} catch {
		res.send('Internal server error');
	}
});

app.post('/logout', async (req, res) => {
	sess = req.session;
	res.clearCookie('username');
	res.clearCookie('email');
	if (sess.username) {
		console.log('Goodbye ' + req.session.username);
	} else {
		// This shoud technically never run since the log out button will only appear if you're logged in
		console.log("User isn't logged in!");
	}

	// Destroy the session, and redirect to the main page
	sess.destroy();
	res.redirect('/');
});

// 404 page
app.use(function (req, res) {
	redirectToPageWithHeader(req, res.status(404), '404');
});

server.listen(3000, async function () {
	console.log('server is listening on port: 3000');

	try {
		await client.connect();
		//gets the lobbies child collection from the database
		lobbies = client.db('HIP-DIB').collection('lobbies');
		console.log('connected to the HIP-DIB lobbies collection'); //debugging purposes
	} catch (e) {
		console.log(e);
	}
});
