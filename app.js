// Dependencies
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
require('./models');
var bcrypt = require('bcryptjs');
var expressSession = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var dotenv = require('dotenv');
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Create server on port 3000
const server = http.listen(3000, function() {
    console.log('listening on *:3000');
});


// Connection to external database
var User = mongoose.model('User');
mongoose.connect('mongodb+srv://user1:3Wa1f7WjAYkjsKR3@cluster0-zjbvi.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
/*
// Payment Fulfillment (Stripe API): Uses body-parser to parse the request into its raw format.
app.post('/pay-success', bodyParser.raw({type: 'application/json'}), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, process.env.ENDPOINT_SECRET);
    } catch (err) {
        console.log(request.body);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the checkout.session.completed event
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // Fulfill the purchase...
        console.log(session);
        User.findOne({
            email: session.customer_email
        }, function(err, user) {
            if (user) {
                user.subscriptionActive = true;
                user.subscriptionId = session.subscription;
                user.customerId = session.customer;
                user.save();
            }
        });
    }

    // Return a response to acknowledge receipt of the event
    response.json({received: true});
});
*/


// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
    secret: process.env.EXPRESS_SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());

// LOGIN: Authenticate and log in a user
passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
}, function(email, password, next) {
    User.findOne({
        email: email
    }, function(err, user) {
        if (err) return next(err);
        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return next({message: 'Email or password incorrect'})
        }
        next(null, user);
    })
}));

// SIGNUP: Authenticate and create a new user
passport.use('signup-local', new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
    passReqToCallback : true
}, function(req, email, password, next) {
    // Check if there is already a user with the same email
    User.findOne({
        email: email
    }, function (err, user) {
        if (err) return next(err);
        if (user) return next({message: "User already exists"});
        // Create a new user
        let newUser = new User({
            firstName: req.body.firstName, // A 
            lastName: req.body.lastName, // A 
            email: email,
            passwordHash: bcrypt.hashSync(password, 10)
        })
        newUser.save(function(err) {
            next(err, newUser);
        });
    });
}));
// Determines which data of the User object should be saved to the session
passport.serializeUser(function(user, next) {
    next(null, user._id);
});
// Retrieves the whole object
passport.deserializeUser(function(id, next) {
    User.findById(id, function(err, user) {
        next(err, user);
    });
});

// Routers

app.get('/', function (req, res, next) {
    res.render('index', {title: "Project D"})
});
/*
app.get('/billing', function (req, res, next) { 
    stripe.checkout.sessions.create({
        customer_email: req.user.email,
        payment_method_types: ['card'],
        subscription_data: {
            items: [{
                plan: process.env.STRIPE_PLAN,
            }],
        },
        success_url:'http://localhost:3000/billing?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/billing',
    }, function(err, session) {
        if (err) return next(err);
        res.render('billing', {firstName: req.user.firstName, lastName: req.user.lastName, sessionId: session.id, subscriptionActive: req.user.subscriptionActive})
    });
    

});
*/

app.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
});

app.get('/chatbot', (req, res, next) => {
    res.render('chatbot', {firstName: req.user.firstName, lastName: req.user.lastName});
});

app.get('/main', function (req, res, next) {
    res.render('main', {firstName: req.user.firstName, lastName: req.user.lastName})
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login-page' }),
    function(req, res) {
        res.redirect('/main', );
    });

app.get('/login-page', function(req, res, next) {
    res.render('login-page')
});

app.get('/register', (req, res, next) => {
    res.render('register');
});


app.post('/signup',
    passport.authenticate('signup-local', { failureRedirect: '/' }),
    function(req, res) {
        res.redirect('/main');
});  


// Chat-app functionality
io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
    })

    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
    });

});



// package.json
// "scripts": {
//     "start": "node ./bin/www"
//   },


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;