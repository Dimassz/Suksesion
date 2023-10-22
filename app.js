const express = require('express')
const app = express();
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.use(
    session({
      secret: 'my_secret_key',
      resave: false,
      saveUninitialized: false,
    })
  );


  var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Dimass123",
    database: "suksesionDb"
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to databases!");
  });


  app.use((req, res, next)=>{
    console.log("User Id = " + req.session.userId)
    if(req.session.userId === undefined){
      res.locals.userName="Tamu"
      req.session.user_number=0
      res.locals.isLoggedIn = false;

    }else{
      res.locals.userName=req.session.userName
      res.locals.userId=req.session.userId
      res.locals.isLoggedIn = true;
    } 
    next()
  })

  app.get('/test', (req, res)=>{
    res.render('test.ejs')
  })

  app.get('/', (req, res)=>{
    res.render("index.ejs")
  })

  app.get('/register', (req, res)=>{
    res.render("register.ejs")
  })

  app.post('/register', (req, res)=>{
    //--------TANGGAL-----------//
    const currentDate = new Date()
    const day = String(currentDate.getDate()).padStart(2, '0')
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const year = currentDate.getFullYear()
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const tanggal = day +" "+ month +" "+ year
    //-------------------//
    const username= req.body.username;
    const email= req.body.email;
    const password= req.body.password;
    const register_date= tanggal;
    const unique_number= Math.floor(Math.random() * 101).toString() + Math.floor(Math.random() * 101).toString() + Math.floor(Math.random() * 101).toString() ;
    const user_number= Math.floor(Math.random() * 101).toString() + Math.floor(Math.random() * 101).toString() + Math.floor(Math.random() * 101).toString() ;

        bcrypt.hash(password, 10, (error, hash)=>{
          console.log(hash)
          con.query("INSERT INTO users(username, email, password, register_date, unique_number, user_number) VALUES(?, ?, ?, ?, ?,?)", [username, email, hash, register_date, unique_number, user_number], (err, results)=>{
                console.log(err)
                console.log(results)
                req.session.userId=results.insertId
                req.session.userName=username
                req.session.user_number=user_number
                res.redirect('/dashboard')
            })
        })  

  } )

  app.get('/login', (req, res)=>{
    res.render('login.ejs')
  })


  app.post('/login', (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    con.query(
        "SELECT * FROM users where username=?", [username], (err, results)=>{
            if(results.length > 0){
              console.log(results)
              const plain=req.body.password
              const hash=results[0].password

              bcrypt.compare(plain, hash, (error, isEqual)=>{
                if(isEqual){
                  console.log("login sukses")
                  req.session.userName = results[0].username
                  req.session.userId= results[0].ID
                  req.session.user_number=results[0].user_number
                  res.redirect('/dashboard')
                }else{
                  console.log('password salah')
                  res.redirect('/login')
                }
              })

            }else{
                console.log("id tidak ditemukan")
                res.redirect('/login')
            }
        }
    )

  })

  app.get('/dashboard', (req, res)=>{
    console.log("User Number = " + req.session.user_number)
    con.query(
      `SELECT * FROM transaksi where user_number = ${req.session.user_number}`,(err, results)=>{
    var pendapatan = 0
    var biaya = 0
    var pajak = 0
    for(var i= 0 ; i <results.length ; i++){
      pendapatan += results[i].jumlah
    }
    for(var i= 0 ; i <results.length ; i++){
      biaya += results[i].biaya_produksi
    }
    for(var i= 0 ; i <results.length ; i++){
      pajak += results[i].pajak
    }
    res.render('dashboard.ejs',{pendapatan:pendapatan, biaya:biaya, pajak:pajak})
      }
      
    )

    
  })

  app.get('/test',(req, res,)=>{

    con.query("SELECT * FROM users", function(err, users_result) {
      const users= users_result
      con.query("SELECT * FROM inventori", function(err, inventori_result) {
        const inventori = inventori_result
        res.render('test.ejs', {users:users, inventori : inventori})
      });
    });

  }
  )
  // app.get('/test', (req, res)=>{
  //   con.query('SELECT * FROM users',(err, users_result)=>{
  //     if (err) {
  //       return console.log('error: ' + err.message);
  //     }
  //     con.query('SELECT * FROM inventori', (err, inventori_result)=>{
  //       if (err) {
  //         return console.log('error: ' + err.message);
  //       }
  //       res.render('test.ejs', {users:users_result, inventori : inventori_result})
  //     })
  //   })
  // })

  app.get('/inventori', (req, res)=>{
    const user_number = req.session.user_number;
    console.log(user_number)
    con.query(
      'SELECT * FROM inventori where user_number = ?',[user_number], (err, results)=>{
        console.log(err)
        res.render('inventori.ejs' , {results:results})
      }
    )

  })

  app.post('/updateInventori', (req, res)=>{
    const namaBarang = req.body.namaBarang;
    const hargaProduksi = req.body.hargaProduksi;
    const hargaJual= req.body.hargaJual
    const kategori= req.body.kategori
    const id=req.body.id
    const user_number= req.session.user_number
    con.query('UPDATE inventori set nama= ?, harga_produksi=?, harga_jual=?, kategori=? where ID = ?', [namaBarang, hargaProduksi, hargaJual, kategori, id], (err, results)=>{
      console.log(err)
      console.log(results)
      res.redirect('back')
    })
  })

  app.post('/addItem',(req, res)=>{
    const nama= req.body.nama;
    const hargaProduksi=req.body.hargaProduksi;
    const hargaJual=req.body.hargaJual;
    const kategori = req.body.kategori;
    const unique_number= Math.floor(Math.random() * 99).toString() + Math.floor(Math.random() * 99).toString() + Math.floor(Math.random() * 99).toString() ;
    const user_number= req.session.user_number;
    
    con.query(
      'INSERT INTO inventori(nama, harga_produksi, harga_jual, unique_number, kategori, user_number) VALUES(?,?,?,?,?,?)',[nama, hargaProduksi,hargaJual,unique_number,kategori, user_number], (err, results)=>{
        console.log(results)
        console.log(err)
        res.redirect('/inventori')
      }
    )
  })

  app.get('/kasir', (req, res)=>{
    console.log(req.sessionID)
    console.log(req.session.user_number)
    con.query(
      `SELECT * FROM inventori where user_number = ${req.session.user_number}` ,(err, results)=>{
        
        res.render('kasir.ejs', {results:results})
      }
    )
  })

  app.post('/deleteItem', (req, res)=>{
    const id = req.body.id;
    con.query(
      'DELETE FROM inventori WHERE ID = ?',[id],(err, results)=>{
        res.redirect('/inventori')     
      }
    )
  })

  app.post('/pay', (req, res)=>{

    const currentDate = new Date()
    const day = String(currentDate.getDate()).padStart(2, '0')
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const year = currentDate.getFullYear()
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const tanggal = day +"-"+ month +"-"+ year+" "+hours+":"+minutes

    const user_number=req.session.user_number
    const cost = req.body.produksi
    const jumlah = req.body.jumlah
    const pajak = req.body.pajak

    const noTransaksi= day+month+currentDate.getFullYear().toString().slice(-2)+Math.floor(Math.random() * 200).toString();

    // const noTransaksi= Math.floor(Math.random() * 101).toString() + Math.floor(Math.random() * 101).toString() + Math.floor(Math.random() * 101).toString() ;
    const kategori = "Hasil Penjualan"
    con.query(
      'INSERT INTO transaksi(jumlah, no_transaksi, kategori, tanggal, user_number, biaya_produksi, pajak) VALUES (?,?,?,?,?,?,?)',[jumlah, noTransaksi, kategori, tanggal, user_number, cost,pajak], (err, results)=>{
        console.log(err)
        console.log(results)
        res.redirect('/kasir')
      }
    )
  })

  

  app.get('/transaksi',(req, res)=>{

    con.query(
      `SELECT * FROM transaksi where user_number = ${req.session.user_number} ORDER BY ID DESC`,(err, results)=>{
        res.render('transaksi.ejs', {results:results})
      }
    )
  })  

  app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
      res.redirect('/');
    });
  });


  app.listen(port, ()=>console.log(`connection to port ${port}`));