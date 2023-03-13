const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});

connection.connect((error) => {
    if (error) {
      console.error('Error connecting to MySQL database: ' + error.stack);
      return;
    }
    console.log('Connected to MySQL database with connection id ' + connection.threadId);
});

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/insert', (req, res) => {
    const taskGroup = req.body.taskGroup;
    const taskCategory = req.body.taskCategory;
    const taskName = req.body.taskName;
    const taskInfo = req.body.taskInfo;
    const taskPercent = req.body.taskPercent;
  
    const query = `INSERT INTO tasks (task_Group, task_Category, task_Name, task_Info, task_Percent_Complete) VALUES 
    ('${taskGroup}', '${taskCategory}','${taskName}', '${taskInfo}','${taskPercent}')`;
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error inserting data into MySQL database: ' + error.stack);
        return res.send('<script>alert("Save task fail"); window.location.href = "add.html";</script>');
      }
      res.send('<script>alert("Save task success"); window.location.href = "personal.html";</script>');
      
    });  
});

app.post('/update', (req, res) => {
  const taskName = req.body.taskName;
  const taskInfo = req.body.taskInfo;
  const taskPercent = req.body.taskPercent;
  const taskID = req.body.taskID;

  const query = `UPDATE tasks
                 SET task_Name = ?, task_Info = ?, task_Percent_Complete = ?
                 WHERE task_ID = ?;`;

  connection.query(query, [taskName, taskInfo, taskPercent, taskID], (error, results) => {
    if (error) {
      console.error('Error inserting data into MySQL database: ' + error.stack);
      return res.send('<script>alert("Edit task fail"); window.location.href = "add.html";</script>');
    }
    res.send('<script>alert("Edit task success"); window.location.href = "personal.html";</script>');
    
  });  
});


app.get('/get-data', (req, res) => {
  const sql = 'SELECT * FROM tasks';
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/edit-data', (req, res) => {
  const taskID = req.query.taskID;
  const sql = `SELECT * FROM tasks WHERE task_ID = ?`;
  connection.query(sql, [taskID], (err, result) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else {
      console.log('Data retrieved successfully!');
      res.json(result);
    }
  });
});

// Define a route to handle GET requests to the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
