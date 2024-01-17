const mongoose = require('mongoose');
const express = require('express');
const app = express();
const cors = require('cors');
const socket = require('socket.io');
const userRouter = require('./routes/userRouter');
const messageRouter = require('./routes/messagesRoute');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const expressSession = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const User = require('./model/userModel');
const bcrypt = require('bcrypt');

// Configure passport for user authentication
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('db connection successfully connected');
}).catch((err) => {
  console.log(err);
});

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (err, user) => {

    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    if (!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password.' });
    console.log(user)

    return done(null, user);
  });
}));

passport.serializeUser((user, done) => {
    console.log(user)

  done(null, user.id);
});

passport.deserializeUser((id, done) => {
    console.log(id)

  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Express middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(expressSession({ secret: process.env.SessionKey || 'thisissecrekey', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Set up rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
app.use('/api/auth', userRouter);
app.use('/api/messages', messageRouter);

// Debugging middleware
app.use((req, res, next) => {
  console.log('User after authentication:', req.user);
  next();
});

app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.json({ success: true, user: req.user.username });
});

const server = app.listen(process.env.PORT, () => {
  console.log(`This port running ${process.env.PORT}`);
});

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
global.IO = io;

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });
  socket.on("send-msg", (data) => {
    console.log({ data }, data);
    const sendUserSocker = onlineUsers.get(data.to);
    if (sendUserSocker) {
      socket.to(sendUserSocker).emit("msg-recieve", { id: data.id, message: data.message });
    }
  });
});
