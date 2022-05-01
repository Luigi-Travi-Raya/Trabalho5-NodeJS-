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
const req = require('express/lib/request');

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
app.get('/', (req,res)=>{
     nomeUsuario = req.session.nome;
     if(req.session.nome == null)
          nomeUsuario = 0
     console.log(req.session.id)
     let dadosFoto = [];
     const resultadoConsulta = Fotos.findAll({}).then(result=>{
          dadosFoto = result;
          Users.findAll({})
          res.render('index',{nomeUsuario,dadosFoto});
     })
 
});

//Rota "localhost/login"
app.get('/login', (req,res)=>{
     let erroLogin = req.session.erroLogin;
     res.render('login',{erroLogin}); 
});

//Rota "localhost/registro"
app.get('/registro', (req,res)=>{
     erroRegistro = req.session.erroRegistro
     if(erroRegistro == null)
          erroRegistro = false;
     res.render('registro',{erroRegistro}); 
});

//Rota "localhost/logout"
app.get('/logout', (req,res)=>{
     if(req.session.logged){
          req.session.destroy();
          res.redirect('/');
     }else{
          req.session.nome = 0;
          res.redirect('/');
     }

     
})

//Rota "localhost/adciona"
app.get('/adciona', (req,res)=>{
     if(req.session.logged)
          res.render('adciona');
     else
          res.redirect('/login')
})

//Rota "localhost/edita/idFoto"
app.get('/edita/', (req,res)=>{
     if(req.session.logged){
          idFoto = req.query.id;
          Fotos.findAll({
               where:{
                    id: idFoto
               }
          }).then(result=>{
               dadosFoto = result;
               res.render('edita',{dadosFoto});
          })
     }else{
          res.redirect('/login')
     }
});

//Rota "localhost/exclui/idFoto"
app.get('/exclui/', (req,res)=>{
     if(req.session.logged){
          idFoto = req.query.id;
          Fotos.findAll({
               where:{
                    id: idFoto
               }
          }).then(result=>{
               dadosFoto = result;
               res.render('exclui',{dadosFoto});
          })
     }else{
          res.redirect('/login')
     }
});

//Rota "localhost/logar"
app.post('/logar', (req,res)=>{
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
          //Consulta para buscar usuário com o email passado pelo user
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
                              req.session.userId = result[0]['id']    
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
app.post('/registrar', (req,res)=>{
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
                         //Consulta para pegar o ID do usuário recém criado
                         const resultadoConsulta = Users.findAll({
                              where:{
                                   email: fields['email']
                              }
                              
                         }).then(result=>{
                                   if(err) throw err;
                                   req.session.logged = true;
                                   req.session.nome = fields['nome'];
                                   req.session.userId = result['id'];
                                   res.redirect('/');
                              })

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
app.post('/adcionar', (req,res)=>{
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
          //Gera um hash para usar como nome da Imagem
          let enderecoFoto = files.foto.filepath;
          let hashGerada = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
          let nomeFoto = hashGerada + '.' + files.foto.mimetype.split('/')[1];
          
          //Muda o endereço da Imagem
          let novoEnderecoFoto = path.join(__dirname, 'public/img' , nomeFoto);
          fs.rename(enderecoFoto, novoEnderecoFoto, function(err){ if (err) throw err})

          let autorFoto = req.session.userId;
          
          //Realiza a inserção no banco
          const resultadoCreate = Fotos.create({
               nome: fields['nomeFoto'],
               id_autor: autorFoto,
               descricao: fields['desc'],
               imagem: nomeFoto
          })
          if(err1) throw err1;

          res.redirect('/');
     })
});

//Rota "localhost/editar/?id="
app.post('/editar/', (req,res)=>{
     let idFoto = req.query.id;
     let form = new formidable.IncomingForm();
     form.parse(req, function (err1, fields, files) {
          if(files.foto.size==0){
               let novoNome = fields['nome'];
               let novoDesc = fields['desc'];

               Fotos.update({
                    nome: novoNome,
                    descricao: novoDesc
                    },{
                         where:{id: idFoto}
                    }    
               ).then(
                    res.redirect('/')
               )

          }else{
               let novoNome = fields['nome'];
               let novoDesc = fields['desc'];

               //Gera um hash para ser o novo nome da imagem
               let enderecoFoto = files.foto.filepath;
               let hashGerada = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
               let nomeFoto = hashGerada + '.' + files.foto.mimetype.split('/')[1];
          
               //Muda o endereço da Imagem
               let novoEnderecoFoto = path.join(__dirname, 'public/img' , nomeFoto);
               fs.rename(enderecoFoto, novoEnderecoFoto, function(err){ if (err) throw err})

               //Consulta para saber o nome da imagem antiga
               Fotos.findAll({
                    where:{
                         id: idFoto
                    }
               }).then(result=>{
                    nomeVelhoFoto = result[0]['imagem'];
                    //Apaga a imagem antiga
                    fs.unlink('./public/img/'+nomeVelhoFoto,function(err){
                         if(err) throw err;
                    })

                    // Realiza o update na tabela
                    Fotos.update({
                         nome: novoNome,
                         descricao: novoDesc,
                         imagem: nomeFoto
                         },{
                              where:{id: idFoto}
                         }    
                    ).then(
                         res.redirect('/')
                    )
               })
          }


     })
});

//Rota "localhost/excluir/?id="
app.post('/excluir/', (req,res)=>{
     let idFoto = req.query.id;
     Fotos.findAll({
          where:{
               id: idFoto
          }
     }).then(result=>{
          nomeFoto = result['0']['imagem'];
          fs.unlink('./public/img/'+nomeFoto,function(err){
               if(err) throw err;
          })
          Fotos.destroy({
               where:{
                    id: idFoto
               }
          }).then(
               res.redirect('/')
          )
     })
});


// Mapeamento das tabelas da Database
(async () => {
     const database = require('./config/db');
     const Fotos = require('./model/fotos');
     const Users = require('./model/users');
     try {
          await database.sync();
          console.log("SUCESSO!!");

     } catch (error) {
          console.log(error);
     }
})();

     
let server = app.listen(port, () =>{
     console.log("Servidor rodando em http://localhost/")
});
