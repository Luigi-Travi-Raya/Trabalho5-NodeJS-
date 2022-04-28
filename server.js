const express = require('express');
const app = express();
const res = require('express/lib/response');

const formidable = require('formidable');
const bcrypt = require('bcrypt');
const pug = require('pug');
const Users = require('./model/users');

const saltRounds = 10;
const port = 80;

// Define 'public' como pasta para recursos
app.use(express.static('public'))

// Define a template engine padrão para o Pug
app.set('view engine','pug');


//---------------------ROTAS---------------------------

// Rota padrão
app.get('/', function(req,res){
     res.render('index'); 
});

//Rota "localhost/login"
app.get('/login', function(req,res){
     res.render('login'); 
});

//Rota "localhost/registro"
app.get('/registro', function(req,res){
     res.render('registro'); 
});


//Rota "localhost/logar"
app.post('/logar', function(req,res){
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
          console.log("OI")
          res.redirect('/');
     }) 
});

//Rota "localhost/registrar"
app.post('/registrar', function(req,res){
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
     // Encripta a senha
          bcrypt.hash(fields['senha'],saltRounds, function(err,hash){
               // Consulta a tabela Users para 
               const resultadoConsulta = Users.findAll({
                    where:{
                         email: fields['email']
                    }
               }).then(result=>{
                    console.log(result);
                    if(result['email'] === fields['email']){
                         console.log("aiowdjwaiddawdawdawdawD")
                    }else{
                         console.log("Email encontrado:" + result[0]['email'])
                         console.log("Email Fornecido:" + fields['email'])
                    }
               })
               // Utiliza o sequelize e insere os dados na tabela Users
               // const resultadoCreate = Users.create({
               //      nome: fields['nome'],
               //      email: fields['email'],
               //      senha: hash
               // })
               // console.log(resultadoCreate);
               // if(err) throw err;
               res.redirect('/');
          })
          
     }) 
});


// Mapeamento das tabelas da Database
(async () => {
     const database = require('./config/db');
     const Fotos = require('./model/fotos');
     const Users = require('./model/users');
     try {
          await database.sync();;
          console.log("SUCESSO!!");

     } catch (error) {
          console.log(error);
     }
     })();

     
let server = app.listen(port, () =>{
     console.log("Servidor rodando em http://localhost/")
});
