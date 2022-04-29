const express = require('express');
const app = express();
const res = require('express/lib/response');
const session = require('express-session')

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
     console.log(nomeUsuario+"   "+req.session.nome);
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
          console.log("1");
     }else{
          req.session.nome = 0;
          console.log("2");
          res.redirect('/');
     }

     
})

//Rota "localhost/logar"
app.post('/logar', function(req,res){
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
          console.log(fields);

          const resultadoConsulta = Users.findAll({
               where:{
                    email: fields['email']
               }
          }).then(result=>{
               if(result.length!==0){
                    bcrypt.compare(fields['senha'], result[0]['senha'], function(err, resultadoSenha){
                         console.log(fields['senha']+"   "+result[0]['senha']);
                         console.log(resultadoSenha);
                         if(resultadoSenha){
                              req.session.logged = true;
                              req.session.nome = result[0]['nome'];    
                              console.log( result[0]['nome']);
                              res.redirect('/');
                         }else{
                              req.session.erroLogin = "senha";
                              console.log("senha nao corresponde");
                              res.redirect('login')
                         }    
                    })
               }else{
                    req.session.erroLogin = "email";
                    console.log("email nao cadastrado");
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
                    console.log(result.length);
                    // Verifica se o email encontrado é igual ao email fornecido pelo usuário
                    if(result.length===0){
                         console.log("Email Fornecido:" + fields['email'])
                         // Insere os dados na tabela Users
                         const resultadoCreate = Users.create({
                              nome: fields['nome'],
                              email: fields['email'],
                              senha: hash
                         })
                         console.log(resultadoCreate);
                         if(err) throw err;
                         req.session.logged = true;
                         req.session.nome = fields['nome'];
                         res.redirect('/');
                    }else{
                         // Se for, ele redireciona
                         req.session.erroRegistro= true;
                         console.log("Já existe conta com este email");
                         res.redirect('registro');
                    }
               })

               
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
