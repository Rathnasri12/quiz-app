const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ratna:ratna$ri%40123@quiz-app.tmhumpw.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected ');
});

module.exports = db;
