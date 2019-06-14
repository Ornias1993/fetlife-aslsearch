// server.js
const mysql = require('mysql');

// First you need to create a connection to the db
const con = mysql.createConnection({
    host: 'localhost',
    user: 'ASL',
    password: 'ASLPASS',
    database: 'aslsearch'
});

con.connect((err) => {
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

con.query('select Nickname, Age, Gender, Role, Friend_Count, Paid_Account, Locality, Region, Country, Avatar_URL, Sexual_Orientation, Interest_Level_Active, Looking_For, Number_of_Pictures, Number_of_Videos FROM userdata where Nickname is not null and Age <= 26 and Age >= 26 limit 10 offset 0', (err,rows) => {
//    con.query('select * FROM userdata', (err,rows) => {
        if(err) throw err;
      
        console.log('Data received from Db:\n');
        console.log(rows);
      });

con.end((err) => {
  // The connection is terminated gracefully 
  // Ensures all previously enqueued queries are still
  // before sending a COM_QUIT packet to the MySQL server.
});

