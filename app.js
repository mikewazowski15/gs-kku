const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
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
app.use(session({
  secret: 'secret-key',
  resave: true,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find user in the database
  const query = `SELECT * FROM users WHERE email = '${username}'`;
  connection.query(query, [username], (error, results) => {
    if (error) {
      console.error('Error retrieving hashed password:', error);
      return;
    }
  
    if (results.length === 0) {
      // No user found with the specified username
      console.log('Invalid username');
      return;
    }
  
    const hashedPassword = results[0].password;
  
    // Compare the entered password with the hashed password
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return;
      }
  
      if (result) {
        // Passwords match, login successful
        const userId = results[0].id;
      req.session.user = results[0].id;

      // Set userId in sessionStorage
      res.send(`<script>
        sessionStorage.setItem('userId', '${userId}');
        window.location.href = "/home.html";
      </script>`);
      } else {
        // Passwords do not match, login failed
        res.send('<script>alert("Invalid Email or Password"); window.location.href = "login.html";</script>');
      }
    });
  });
});

app.post('/insert', (req, res) => {
    const data = req.body.data;
    const taskCategory = req.body.taskCategory;
    const taskName = req.body.taskName;
    const taskInfo = req.body.taskInfo;
    const taskPercent = req.body.taskPercent;
    const taskDate = req.body.taskDate;
    const taskSource = req.body.okrsrm;
    const taskGroup = req.body.taskGroups;

  // First, insert data into the 'tasks' table to generate the task_ID
  const insertQuery = `INSERT INTO tasks (task_Group, task_Category, task_Name, task_Info, task_Date, task_Percent_Complete, id_Staff, task_Source) VALUES 
                      ('', '${taskCategory}', '${taskName}', '${taskInfo}', '${taskDate}', '${taskPercent}', '', '${taskSource}')`;

  connection.query(insertQuery, (error, results) => {

        if (error) {
          console.error('Error inserting data into other_table:', error);
          return res.send('<script>alert("Save task fail"); window.location.href = "add.html";</script>');
        }

        res.send('<script>alert("Save task success"); window.location.href = "personal.html";</script>');
        console.log(data);
  });
});

app.post('/update', (req, res) => {
  const taskName = req.body.taskName;
  const taskInfo = req.body.taskInfo;
  const taskPercent = req.body.taskPercent;
  const taskID = req.body.taskID;
  const taskDate = req.body.taskDate;
  const taskokrsrm = req.body.taskokrsrm;

  const query = `UPDATE tasks
                 SET task_Name = ?, task_Info = ?, task_Percent_Complete = ?, task_Date = ?, task_Source = ?
                 WHERE task_ID = ?;`;

  connection.query(query, [taskName, taskInfo, taskPercent, taskDate, taskokrsrm, taskID], (error, results) => {
    if (error) {
      console.error('Error inserting data into MySQL database: ' + error.stack);
      return res.send('<script>alert("Edit task fail"); window.location.href = "personal.html";</script>');
    }
    res.send('<script>alert("Edit task success"); window.location.href = "personal.html";</script>');
    
  });  
});

app.post('/updateProfile', (req, res) => {
  const userName = req.body.userName;
  const email = req.body.email;
  const password = req.body.password;
  const userID = parseInt(req.body.userID);

  if (password === '') {
    // Password field is empty, skip the update and keep the existing password
    const query = `UPDATE users
                   SET username = ?, email = ?
                   WHERE id = ?;`;

    connection.query(query, [userName, email, userID], (error, results) => {
      if (error) {
        console.error('Error updating user profile:', error);
        return res.send('<script>alert("An error occurred"); window.location.href = "editInfo.html";</script>');
      }
      
      res.send('<script>alert("บันทึกข้อมูลสำเร็จ"); window.location.href = "home.html";</script>');
    });
  } else {
    if (!validatePassword(password)) {
      // Password does not meet the requirements
      return res.send('<script>alert("รหัสผ่านต้องประกอบด้วยตัวอักษรตัวใหญ่อย่างน้อย 1 ตัว และตัวเลขอย่างน้อย 1 ตัว และมีความยาวอย่างน้อย 8 ตัวอักษร"); window.location.href = "editInfo.html";</script>');
    }

    const query = `UPDATE users
                   SET username = ?, email = ?, password = ?
                   WHERE id = ?;`;

    bcrypt.hash(password, 10, function(err, hash) {
      if (err) {
        console.error('Error hashing password:', err);
        return res.send('<script>alert("An error occurred"); window.location.href = "editInfo.html";</script>');
      }

      connection.query(query, [userName, email, hash, userID], (error, results) => {
        if (error) {
          console.error('Error updating user profile:', error);
          return res.send('<script>alert("An error occurred"); window.location.href = "editInfo.html";</script>');
        }
        
        res.send('<script>alert("บันทึกข้อมูลสำเร็จ"); window.location.href = "home.html";</script>');
      });
    });
  }
});

app.get('/get-name', (req, res) => {
  const sql = `SELECT * FROM users`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-groupTask', (req, res) => {
  const sql = `SELECT DISTINCT groupTask FROM users`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-groupMission', (req, res) => {
  const sql = `SELECT DISTINCT groupMission,groupTask FROM users `;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-data-category', (req, res) => {
  const sql = `SELECT DISTINCT task_Category,id_Staff FROM tasks`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-data', (req, res) => {
  const userId = parseInt(req.session.user);
  const sql = `SELECT * FROM tasks WHERE task_Group = 'งานหลัก' AND id_Staff = ${userId}`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-data2', (req, res) => {
  const userId = parseInt(req.session.user);
  const sql = `SELECT * FROM tasks WHERE task_Group = 'งานรอง' AND id_Staff = ${userId}`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-data3', (req, res) => {
  const userId = parseInt(req.session.user);
  const sql = `SELECT * FROM tasks WHERE task_Group = 'งานอื่นๆ' AND id_Staff = ${userId}`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-user', (req, res) => {
  const sql = `SELECT * FROM users,tasks WHERE users.id BETWEEN 1 AND 26`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-all-task5', (req, res) => {
  const sql = `SELECT * FROM users,tasks WHERE users.id = tasks.id_Staff AND tasks.task_Group = 'งานหลัก'`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-all-task6', (req, res) => {
  const sql = `SELECT * FROM users LEFT JOIN tasks ON users.id = tasks.id_Staff`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-all-task', (req, res) => {
  const sql = `SELECT * FROM users WHERE users.id BETWEEN 1 AND 26`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-all-task2', (req, res) => {
  const staffId = req.query.staffId;
  const sql = `SELECT * FROM users,tasks WHERE tasks.id_Staff = ${staffId} AND users.id = tasks.id_Staff AND tasks.task_Group = 'งานรอง'`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-all-task3', (req, res) => {
  const staffId = req.query.staffId;
  const sql = `SELECT * FROM users,tasks WHERE tasks.id_Staff = ${staffId} AND users.id = tasks.id_Staff AND tasks.task_Group = 'งานอื่นๆ'`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-all-task4', (req, res) => {
  const staffId = req.query.staffId;
  const sql = `SELECT * FROM users,tasks WHERE tasks.id_Staff = ${staffId} AND users.id = tasks.id_Staff AND tasks.task_Group = 'งานหลัก'`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});


app.get('/get-okrs-rm', (req, res) => {
  const sql = `SELECT * FROM tasks WHERE task_Source <> ''`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-more-data', (req, res) => {
  const sql = `SELECT * FROM tasks,users`;
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Data retrieved successfully!');
    res.json(result);
  });
});

app.get('/get-profile-data', (req, res) => {
  const sql = `SELECT * FROM users`;
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
