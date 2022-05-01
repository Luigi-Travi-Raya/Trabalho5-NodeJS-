const express = require('express');
const app = express();
const res = require('express/lib/response');
const session = require('express-session')

const formidable = require('formidable');
const bcrypt = require('bcrypt');
const pug = require('pug');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const Users = require('./model/users');
const Fotos = require('./model/fotos');


const saltRounds = 10;
const port = 80;

// Define 'public' como pasta para recursos
app.use(express.static('public'))

// Define a template engine padrão para o Pug
app.set('view engine','pug');

app.use(session({
     secret: 'JoaoPedro',
     resave: false,
     saveUninitialized: true
}));

//---------------------ROTAS---------------------------

// Rota padrão
app.get('/', function(req,res){
     nomeUsuario = req.session.nome;
     if(req.session.nome == null)
          nomeUsuario = 0
     res.render('index',{nomeUsuario}); 
});

//Rota "localhost/login"
app.get('/login', function(req,res){
     let erroLogin = req.session.erroLogin;
     res.render('login',{erroLogin}); 
});

//Rota "localhost/registro"
app.get('/registro', function(req,res){
     erroRegistro = req.session.erroRegistro
     if(erroRegistro == null)
          erroRegistro = false;
     res.render('registro',{erroRegistro}); 
});

//Rota "localhost/logout"
app.get('/logout', function(req,res){
     if(req.session.logged){
          req.session.destroy();
          res.redirect('/');
     }else{
          req.session.nome = 0;
          res.redirect('/');
     }

     
})

//Rota "localhost/adciona"
app.get('/adciona', function(req,res){
     if(req.session.logged)
          res.render('adciona');
     else
          res.redirect('/login')
})

//Rota "localhost/logar"
app.post('/logar', function(req,res){
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
          const resultadoConsulta = Users.findAll({
               where:{
                    email: fields['email']
               }
          }).then(result=>{
               if(result.length!==0){
                    bcrypt.compare(fields['senha'], result[0]['senha'], function(err, resultadoSenha){
                         if(resultadoSenha){
                              req.session.logged = true;
                              req.session.nome = result[0]['nome'];    
                              res.redirect('/');
                         }else{
                              req.session.erroLogin = "senha";
                              res.redirect('login')
                         }    
                    })
               }else{
                    req.session.erroLogin = "email";
                    res.redirect('login')
               }
          })

          
          
     }) 
});

//Rota "localhost/registrar"
app.post('/registrar', function(req,res){
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
     // Encripta a senha
          bcrypt.hash(fields['senha'],saltRounds, function(err,hash){
               // Consulta a tabela Users para veriricar o email
               const resultadoConsulta = Users.findAll({
                    where:{
                         email: fields['email']
                    }
               }).then(result=>{
                    // Verifica se o email encontrado é igual ao email fornecido pelo usuário
                    if(result.length===0){
                         // Insere os dados na tabela Users
                         const resultadoCreate = Users.create({
                              nome: fields['nome'],
                              email: fields['email'],
                              senha: hash
                         })
                         if(err) throw err;
                         req.session.logged = true;
                         req.session.nome = fields['nome'];
                         res.redirect('/');
                    }else{
                         // Se for, ele redireciona
                         req.session.erroRegistro= true;
                         res.redirect('registro');
                    }
               })

               
          })
          
     }) 
});

//Rota "localhost/adcionar"
app.post('/adcionar', function(req,res){
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
          //Gera um hash para usar como nome da Imagem
          let enderecoFoto = files.foto.filepath;
          let hashGerada = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
          let nomeFoto = hashGerada + '.' + files.foto.mimetype.split('/')[1];
          
          //Muda o endereço da Imagem
          let novoEnderecoFoto = path.join(__dirname, 'public/img' , nomeFoto);
          fs.rename(enderecoFoto, novoEnderecoFoto, function(err){ if (err) throw err})

          let autorFoto = req.session.nome;
          
          console.log(autorFoto + "\n" + nomeFoto + "\n" + fields['nomeFoto'] + "\n" + fields['desc']);

          //Realiza a inserção no banco
          const resultadoCreate = Fotos.create({
               nome: fields['nomeFoto'],
               autor: autorFoto,
               descricao: fields['desc'],
               imagem: nomeFoto
          })
          if(err1) throw err1;

          res.redirect('/');
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
