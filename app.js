const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const Question = require('./models/question');
require('./db');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

let userData = {};


app.get('/', (req, res) => {
  res.render('login');
});


app.post('/start', async (req, res) => {
  const { name, email, phone } = req.body;
  userData = { name, email, phone };
  res.render('instruction', { name });
  const allQuestions = await Question.find({});

  const categories = ['General Aptitude', 'Web', 'English', 'Logical Reasoning'];
  const categorizedQuestions = {};

  categories.forEach(cat => {
    categorizedQuestions[cat] = allQuestions.filter(q => q.category === cat);
  });

});
app.post('/quiz', async (req, res) => {
  const { name } = req.body;
  const allQuestions = await Question.find({});

  const categorizedQuestions = {
    'General Aptitude': allQuestions.filter(q => q.category === 'General Aptitude'),
    'Web': allQuestions.filter(q => q.category === 'Web'),
    'English': allQuestions.filter(q => q.category === 'English'),
    'Logical Reasoning': allQuestions.filter(q => q.category === 'Logical Reasoning'),
  };

  res.render('quiz', {
    name,
    categorizedQuestions,
    categories: Object.keys(categorizedQuestions)
  });
});




// Submit Quiz
app.post('/submit', async (req, res) => {
  try {
    const submittedAnswers = req.body;
    const allQuestions = await Question.find({});
    let score = 0;

    allQuestions.forEach(question => {
      const userAnswer = submittedAnswers[`q${question._id}`];
      if (userAnswer === question.answer) {
        score++;
      }
    });

    // Nodemailer setup
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sriforcasual@gmail.com',
        pass: 'baxp shbj snwx mdwu' 
      }
    });

    await transporter.sendMail({
      from: '"Quiz App" <sriforcasual@gmail.com>',
      to: userData.email,
      subject: 'Quiz Submission Confirmation',
      text: `Hi ${userData.name},\n\nYou have successfully completed the quiz.\nYour Score: ${score}\n\nThank you!`
    });

    res.render('result', { score, total: allQuestions.length, userData });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error calculating score or sending email");
  }
});

app.listen(3000, () => console.log('Quiz app running at http://localhost:3000'));
