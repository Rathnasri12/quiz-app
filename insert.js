const mongoose = require('mongoose');
const Question = require('./models/question');
require('./db');

// First, delete all existing questions to avoid duplicates
const seedQuestions = async () => {
  try {
    // Step 1: Clear the collection
    await Question.deleteMany({});
    console.log('Old questions deleted.');

    // Step 2: Insert new questions
    const questions = [
      // -- General Aptitude (10)
      { category: 'General Aptitude', question: 'If 5 workers can complete a task in 8 days, how many days would it take 8 workers to complete the same task?', options: ['3.5', '5', '6.25', '7'], answer: '5' },
      { category: 'General Aptitude', question: 'A train running at 60 km/h crosses a pole in 9 seconds. What is the length of the train?', options: ['180 meters', '150 meters', '120 meters', '90 meters'], answer: '150 meters' },
      { category: 'General Aptitude', question: 'In a class of 45 students, 20 play cricket, 15 play football, and 10 play both. How many students play neither?', options: ['10', '20', '15', '25'], answer: '15' },
      { category: 'General Aptitude', question: 'What is the value of 3.6 ÷ 0.4 + 2.5 × 1.2?', options: ['9.7', '10.1', '12.2', '11.3'], answer: '9.7' },
      { category: 'General Aptitude', question: 'If 60% of a number is 120, what is the number?', options: ['150', '180', '200', '220'], answer: '200' },
      { category: 'General Aptitude', question: 'If a shopkeeper marks up an item by 30% and gives 20% discount, what is the overall profit/loss?', options: ['4% profit', '4% loss', '10% profit', '10% loss'], answer: '4% profit' },
      { category: 'General Aptitude', question: 'The average of five consecutive odd numbers is 35. What is the largest?', options: ['39', '41', '43', '45'], answer: '39' },
      { category: 'General Aptitude', question: 'If a sum doubles in 10 years at simple interest, what is the rate?', options: ['5%', '10%', '12%', '15%'], answer: '10%' },
      { category: 'General Aptitude', question: 'How many different words can be formed with "LEAD"?', options: ['12', '18', '24', '30'], answer: '24' },
      { category: 'General Aptitude', question: 'A man travels 2/3 of journey at 4 km/h and rest at 6 km/h. Journey is 12 hours. Distance?', options: ['48 km', '56 km', '60 km', '64 km'], answer: '60 km' },

      // -- Web (13 questions - removed the 2 problematic ones)
      //{ category: 'Web', question: 'Which HTML tag is used to define an unordered list?', options: ['<ul>', '<ol>', '<li>', '<list>'], answer: '<ul>' },
      //{ category: 'Web', question: 'In HTML5, which element is used to represent navigation links?', options: ['<nav>', '<header>', '<footer>', '<link>'], answer: '<nav>' },

      { category: 'Web', question: 'How do you select class "example" in CSS?', options: ['example', '.example', '#example', '*example'], answer: '.example' },
      { category: 'Web', question: 'Which property is used to change text color in CSS?', options: ['color', 'text-color', 'font-color', 'background-color'], answer: 'color' },
      { category: 'Web', question: 'What does CSS stand for?', options: ['Color Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Computer Style Sheets'], answer: 'Cascading Style Sheets' },
      { category: 'Web', question: 'Correct syntax to declare a JavaScript variable?', options: ['var x = 10;', 'x : 10;', 'int x = 10;', 'let x -> 10;'], answer: 'var x = 10;' },
      { category: 'Web', question: 'Which keyword defines a constant variable in JS?', options: ['let', 'var', 'const', 'final'], answer: 'const' },
      { category: 'Web', question: 'What is output of console.log(2 + "2")?', options: ['22', '4', 'NaN', 'undefined'], answer: '22' },
      { category: 'Web', question: 'Which is NOT a valid JavaScript data type?', options: ['String', 'Number', 'Character', 'Boolean'], answer: 'Character' },
      { category: 'Web', question: 'What does == do in JS?', options: ['value and type', 'value only', 'reference', 'type only'], answer: 'value only' },
      { category: 'Web', question: 'Which method rounds to nearest integer?', options: ['Math.ceil()', 'Math.round()', 'Math.floor()', 'Math.truncate()'], answer: 'Math.round()' },
      { category: 'Web', question: 'let x; console.log(x); output?', options: ['undefined', 'null', '0', 'NaN'], answer: 'undefined' },
      { category: 'Web', question: 'Calling test without () returns?', options: ['Hello', 'Error', 'Function reference', 'Executes twice'], answer: 'Function reference' },
      { category: 'Web', question: 'arr = [1,2,3]; arr[3] = 4; arr.length?', options: ['3', '4', 'undefined', '2'], answer: '4' },
      { category: 'Web', question: 'typeof null in JS?', options: ['null', 'object', 'undefined', 'boolean'], answer: 'object' },

      // -- English (10)
      { category: 'English', question: 'Synonym of "abundant"?', options: ['scarce', 'plenty', 'rare', 'minimum'], answer: 'plenty' },
      { category: 'English', question: 'Correct spelling?', options: ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], answer: 'Accommodate' },
      { category: 'English', question: 'Antonym of "optimistic"?', options: ['pessimistic', 'hopeful', 'cheerful', 'positive'], answer: 'pessimistic' },
      { category: 'English', question: 'I am looking forward ____ the holidays.', options: ['at', 'to', 'on', 'in'], answer: 'to' },
      { category: 'English', question: 'Error in: "She doesn’t like cooking, neither does he."', options: ['doesn’t', 'cooking', 'neither', 'he'], answer: 'neither' },
      { category: 'English', question: 'Meaning of "novel"?', options: ['old', 'recent', 'creative', 'curious'], answer: 'creative' },
      { category: 'English', question: 'I suggest that he ____ his decision.', options: ['reconsider', 'reconsiders', 'reconsidered', 'reconsidering'], answer: 'reconsider' },
      { category: 'English', question: 'Once in a ____.', options: ['month', 'week', 'lifetime', 'year'], answer: 'lifetime' },
      { category: 'English', question: 'Indirect speech: "She said, I am studying now"', options: ['She said that she is studying now.', 'She said that she was studying then.', 'She said that I am studying now.', 'She said she was studying now.'], answer: 'She said that she was studying then.' },
      { category: 'English', question: 'I have been working here ____ five years.', options: ['since', 'for', 'from', 'of'], answer: 'for' },

      // -- Logical Reasoning (10)
      { category: 'Logical Reasoning', question: 'If MANGO = 53, what is APPLE?', options: ['46', '50', '45', '55'], answer: '46' },
      { category: 'Logical Reasoning', question: 'Find the odd one out', options: ['Car', 'Train', 'Bus', 'Computer'], answer: 'Computer' },
      { category: 'Logical Reasoning', question: '2, 6, 12, 20, 30, __?', options: ['36', '40', '42', '48'], answer: '42' },
      { category: 'Logical Reasoning', question: 'If 3+5=8, 4+6=10, 5+7=?', options: ['11', '12', '14', '15'], answer: '12' },
      { category: 'Logical Reasoning', question: 'Facing north, turns 135° clockwise?', options: ['East', 'North-East', 'South-East', 'South-West'], answer: 'South-East' },
      { category: 'Logical Reasoning', question: 'Code: A=2, B=4, C=6, HELLO=?', options: ['46', '48', '52', '54'], answer: '48' },
      { category: 'Logical Reasoning', question: 'Find missing: 4, 9, 16, 25, __?', options: ['35', '36', '37', '38'], answer: '36' },
      { category: 'Logical Reasoning', question: '50 people: 30 adults, 20 children. 15 adults leave. % children?', options: ['40%', '50%', '60%', '75%'], answer: '50%' },
      { category: 'Logical Reasoning', question: 'Statement: "Some pens are pencils". Conclusion I: "Some pencils are pens", II: "All pens are pencils"', options: ['Only I', 'Only II', 'Both', 'Neither'], answer: 'Only I' },
      { category: 'Logical Reasoning', question: 'If "CAT" = 3120, "DOG"=?', options: ['4150', '4160', '4250', '4240'], answer: '4240' },
    ];

    await Question.insertMany(questions);
    console.log('New questions inserted successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close(); // Close the connection
  }
};

// Execute the seeding function
seedQuestions();