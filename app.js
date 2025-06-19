const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const session = require('express-session');
const Question = require('./models/question');
const Student = require('./models/student');
require('./db');
const multer = require('multer');

const fs = require('fs');

const app = express();

// =================== MIDDLEWARES ===================
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/recordings', express.static('recordings')); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'sri-quiz-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 10 * 365 * 24 * 60 * 60 * 1000 }
}));

// =================== SESSION CHECK ===================
function ensureLoggedIn(req, res, next) {
  if (!req.session.user || !req.session.otpVerified) return res.redirect('/');
  next();
}
//==========CEMARA ENABLE========//


// Ensure 'recordings' directory exists
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'recordings');
  },
  filename: function (req, file, cb) {
    const email = req.session.user?.email || 'unknown';
    const safeEmail = email.replace(/[@.]/g, '_'); // ✅ safe filename
    cb(null, `${safeEmail}.webm`);
  }
});
const upload = multer({ storage });

// POST /upload-video
app.post('/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('❌ No video uploaded');
  }
  res.send('✅ Video uploaded successfully');
});


// =================== SIGNUP ===================
app.get('/signup', (req, res) => {
  res.render('signup', { error: null, success: null });
});
app.post('/signup', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    let user = await Student.findOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (!user) {
      user = new Student({ name, email, phone, otp, otpExpires, isVerified: false });
      await user.save();
    } else {
      if (user.isVerified) {
        return res.render('signup', { 
          error: '✅ Email already registered. Please login.' 
        });
      }
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sriforcasual@gmail.com',
        pass: 'baxp shbj snwx mdwu'
      }
    });

    await transporter.sendMail({
      from: 'Quiz App <sriforcasual@gmail.com>',
      to: email,
      subject: 'Your OTP for Quiz Registration',
      text: `Hi ${user.name},\n\nYour OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.`
    });

    // Store in session for verification
    req.session.signupData = { email, otp };
    
    // Render the verify-otp view (not the path)
    res.render('verify-otp', { 
      email,
      error: null
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).render('signup', { 
      error: '❌ Something went wrong. Please try again.' 
    });
  }
});

// =================== VERIFY SIGNUP OTP ===================
app.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await Student.findOne({ email });

    if (!user) {
      return res.render('verify-otp', {
        email,
        error: '❌ User not found. Please sign up again.'
      });
    }

    // Check if OTP matches and isn't expired
    if (user.otp === otp && new Date() < user.otpExpires) {
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      
      // Set session variables
      req.session.user = { 
        name: user.name, 
        email: user.email, 
        phone: user.phone 
      };
      req.session.otpVerified = true;
      
      return res.redirect('/instruction');
    }

    // If OTP is wrong or expired
    res.render('verify-otp', {
      email,
      error: '❌ Invalid or expired OTP. Please try again.'
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.render('verify-otp', {
      email: req.body.email,
      error: '❌ Something went wrong. Please try again.'
    });
  }
});
// =================== LOGIN ===================
app.get('/', (req, res) => {
  res.render('login', { showOTP: false, email: '' });
});

app.post('/login', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).send('❌ All fields are required.');
    }

    const user = await Student.findOne({ email, name, phone });
    if (!user) return res.send('❌ User not found. Please sign up.');
    if (!user.isVerified) return res.send('⚠️ Please verify your email before logging in.');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sriforcasual@gmail.com',
        pass: 'baxp shbj snwx mdwu'
      }
    });

    await transporter.sendMail({
      from: 'Quiz App <sriforcasual@gmail.com>',
      to: email,
      subject: 'Your OTP for Login',
      text: `Hi ${user.name},\n\nYour OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.`
    });

    req.session.tempLogin = { name, email, phone };
    res.render('login', { showOTP: true, email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('❌ Something went wrong.');
  }
});

// =================== VERIFY LOGIN OTP ===================
app.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await Student.findOne({ email });

    if (!user || !user.otp || !user.otpExpires) {
      return res.send('❌ Invalid login. Try again.');
    }

    if (new Date() > user.otpExpires) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.send('❌ OTP expired.');
    }

    if (otp.trim() !== user.otp.toString().trim()) {
      return res.send('❌ Incorrect OTP.');
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    req.session.user = { name: user.name, email: user.email, phone: user.phone };
    req.session.otpVerified = true;

    res.redirect(user.hasSubmitted ? '/dashboard' : '/instruction');
  } catch (err) {
    console.error('Login OTP error:', err);
    res.status(500).send('❌ Something went wrong.');
  }
});

// =================== QUIZ FLOW ===================
app.get('/instruction', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const { name, email } = req.session.user;
  res.render('instruction', { name, email }); // ✅ Fix
});


app.post('/quiz', ensureLoggedIn, async (req, res) => {
  try {
    const allQuestions = await Question.find({});
    const categorizedQuestions = {
      'General Aptitude': allQuestions.filter(q => q.category === 'General Aptitude'),
      'Web': allQuestions.filter(q => q.category === 'Web'),
      'English': allQuestions.filter(q => q.category === 'English'),
      'Logical Reasoning': allQuestions.filter(q => q.category === 'Logical Reasoning')
    };

    res.render('quiz', {
      name: req.session.user.name,
       email: req.session.user.email,
      categorizedQuestions,
      categories: Object.keys(categorizedQuestions)
    });
  } catch (err) {
    console.error('Quiz error:', err);
    res.status(500).send('❌ Error loading quiz.');
  }
});

app.post('/submit', ensureLoggedIn, async (req, res) => {
  try {
    const submittedAnswers = req.body;
    const allQuestions = await Question.find({});
    let totalScore = 0;
    const sectionScores = {
      'General Aptitude': { correct: 0, total: 0 },
      'Web': { correct: 0, total: 0 },
      'English': { correct: 0, total: 0 },
      'Logical Reasoning': { correct: 0, total: 0 }
    };

    allQuestions.forEach(q => {
      const answer = submittedAnswers[`q${q._id}`];
      sectionScores[q.category].total++;
      if (answer === q.answer) {
        sectionScores[q.category].correct++;
        totalScore++;
      }
    });

    const user = await Student.findOneAndUpdate(
      { email: req.session.user.email },
      {
        hasSubmitted: true,
        score: totalScore,
        submittedAt: new Date(),
        submittedAnswers,
        sectionScores
      },
      { new: true }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sriforcasual@gmail.com',
        pass: 'baxp shbj snwx mdwu'
      }
    });

    await transporter.sendMail({
      from: 'Quiz App <sriforcasual@gmail.com>',
      to: user.email,
      subject: 'Quiz Submission Confirmation',
      text: `Hi ${user.name},\n\nYou completed the quiz.\nScore: ${totalScore}/45`
    });

    const sectionText = Object.entries(sectionScores).map(
      ([cat, val]) => `- ${cat}: ${val.correct}/${val.total}`
    ).join('\n');

    await transporter.sendMail({
      from: 'Quiz App',
      to: 'muralidharan@blueoshan.com',
      subject: 'Student Quiz Completed',
      text: `📝 ${user.name} completed the quiz.\nEmail: ${user.email}\n\n${sectionText}\nTotal Score: ${totalScore}/45`
    });

    res.render('result', {
      score: totalScore,
      total: allQuestions.length,
      userData: user,
      sectionScores
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).send('❌ Submission failed.');
  }
});

// =================== DASHBOARD ===================
app.get('/dashboard', ensureLoggedIn, async (req, res) => {
  try {
    const user = await Student.findOne({ email: req.session.user.email });
    res.render('dashboard', {
      name: user.name,
      email: user.email,
      phone: user.phone,
      score: user.score
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('❌ Error loading dashboard.');
  }
});

// =================== USER VIEW RESULT ===================
app.get('/view-result', ensureLoggedIn, async (req, res) => {
  try {
    const user = await Student.findOne({ email: req.session.user.email });
    if (!user.hasSubmitted) return res.redirect('/dashboard');
    
    const allQuestions = await Question.find({});
    const resultView = allQuestions.map(q => {
      const userAnswer = user.submittedAnswers[`q${q._id}`];
      let status = 'skipped';
      if (userAnswer) status = userAnswer === q.answer ? 'correct' : 'wrong';
      return {
        question: q.question,
        options: q.options,
        correct: q.answer,
        userAnswer,
        status,
        category: q.category
      };
    });
    
    res.render('admin-view-result', { student: user, resultView });
  } catch (err) {
    console.error('View result error:', err);
    res.status(500).send('❌ Error loading results.');
  }
});

/// =================== ADMIN VIEW ===================
app.get('/admin-dashboard', async (req, res) => {
  try {
    const students = await Student.find({}).sort({ submittedAt: -1 });
    const questions = await Question.find({});
    res.render('admin-dashboard', { 
      students,
      questions,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('❌ Error loading admin dashboard.');
  }
});

// =================== ADMIN VIEW RESULT ===================
app.get('/admin-view-result/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).send('Student not found');
    }

    const allQuestions = await Question.find({});
    
    // Check if student has submitted answers
    if (!student.submittedAnswers || Object.keys(student.submittedAnswers).length === 0) {
      return res.status(400).send('This student has not submitted any answers');
    }

    const resultView = allQuestions.map(q => {
      const userAnswer = student.submittedAnswers[`q${q._id}`];
      let status = 'skipped';
      if (userAnswer) {
        status = userAnswer === q.answer ? 'correct' : 'wrong';
      }
      return {
        question: q.question,
        options: q.options,
        correct: q.answer,
        userAnswer,
        status,
        category: q.category
      };
    });

    res.render('admin-view-result', { 
      student: student.toObject(), 
      resultView 
    });

  } catch (err) {
    console.error('Admin view result error:', err);
    res.status(500).render('error', {
      message: 'Failed to load result',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// =================== QUESTION MANAGEMENT ===================
app.get('/edit-question/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).send('Question not found');
    res.render('edit-question', { question });
  } catch (err) {
    console.error('Edit question error:', err);
    res.redirect('/admin-dashboard?error=Error loading question');
  }
});

app.post('/update-question/:id', async (req, res) => {
  try {
    const { question, options, answer, category } = req.body;
    const optionsArray = options.split('\n').filter(opt => opt.trim() !== '');
    
    await Question.findByIdAndUpdate(req.params.id, {
      question,
      options: optionsArray,
      answer,
      category
    });
    
    res.redirect('/admin-dashboard?success=Question updated successfully');
  } catch (err) {
    console.error('Update question error:', err);
    res.redirect('/admin-dashboard?error=Error updating question');
  }
});

app.get('/add-question', (req, res) => {
  res.render('add-question');
});

app.post('/add-question', async (req, res) => {
  try {
    const { question, options, answer, category } = req.body;
    const optionsArray = options.split('\n').filter(opt => opt.trim() !== '');
    
    const newQuestion = new Question({
      question,
      options: optionsArray,
      answer,
      category
    });
    
    await newQuestion.save();
    res.redirect('/admin-dashboard?success=Question added successfully');
  } catch (err) {
    console.error('Add question error:', err);
    res.redirect('/admin-dashboard?error=Error adding question');
  }
});

app.get('/delete-question/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.redirect('/admin-dashboard?success=Question deleted successfully');
  } catch (err) {
    console.error('Delete question error:', err);
    res.redirect('/admin-dashboard?error=Error deleting question');
  }
});

// =================== STUDENT MANAGEMENT ===================
app.get('/edit-student/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send('Student not found');
    res.render('edit-student', { student });
  } catch (err) {
    console.error('Edit student error:', err);
    res.redirect('/admin-dashboard?error=Error loading student');
  }
});

app.post('/update-student/:id', async (req, res) => {
  try {
    const { name, email, phone, score } = req.body;
    
    await Student.findByIdAndUpdate(req.params.id, {
      name,
      email,
      phone,
      score: parseInt(score)
    });
    
    res.redirect('/admin-dashboard?success=Student updated successfully');
  } catch (err) {
    console.error('Update student error:', err);
    res.redirect('/admin-dashboard?error=Error updating student');
  }
});

app.get('/delete-student/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect('/admin-dashboard?success=Student deleted successfully');
  } catch (err) {
    console.error('Delete student error:', err);
    res.redirect('/admin-dashboard?error=Error deleting student');
  }
});

// =================== LOGOUT ===================
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// =================== START SERVER ===================
app.listen(3000, () => console.log('✅ Quiz app running at http://localhost:3000'));