// LLIBRERIES

const http=require('http');
const nodemailer=require('nodemailer');
const Cookies=require('cookies');
const url=require('url');
const fs=require('fs');
const querystring = require('querystring');
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('crypto support is disabled!');
}

const Pwned = require('pwned-api');
const pwner = new Pwned();


//VARIABLES GLOBALS

const host = '127.0.0.1';
const port = 8080;

const style = 
`
input[type=text], input[type=password] {
  width: 70%;
  padding: 12px 20px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid #ccc;
  box-sizing: border-box;
}
form {
  border: 3px solid #f1f1f1;
}
a {
  background-color: #04AA6D;
  color: white;
  padding: 14px 20px;
  margin: 8px 0;
  border: none;
  cursor: pointer;
  width: 300px;
}
input[type=submit] {
  background-color: #04AA6D;
  color: white;
  padding: 14px 20px;
  margin: 8px 0;
  border: none;
  cursor: pointer;
  width: 300px;
}
input[type=submit]:hover {
  opacity: 0.8;
}
`


const header =  
`
  <!doctype html>
  <html>
  <head>

  <style> ` +style+ `</style>

  </head>
  <body>
`

const feeter =  
`
  </body>
  </html>
`

var keys = ['keyboard cat'];
var cookies;

var transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  logger: true,
  debug: false,
  ignoreTLS: true,
  auth: {
    user: "sistemulti1@gmail.com",
    pass: "Patata2020",
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

var mailOptions = {
  from: "Remitente",
  to: "",
  subject: "NewPasword",
  text: "test nodemailer",
}



//ESTRUCTURES

  class user  {
    usr = "";
    pwd = "";
    email = "";

    constructor(_usr,_pwd,_email) {
      this.usr = _usr;
      this.pwd = _pwd;
      this.email = _email;
    }

    equals(_user) {
      this.usr = _user.usr;
      this.pwd = _user.pwd;
      this.email = _user.email;
    }

    toQuerryString(){
      return "usr="+this.usr+"&pwd="+this.pwd+"&email="+this.email
    }
  };


//FILE FUNCIONS//


function save(file,data){
    data = JSON.stringify(data);
	const fs = require('fs')
	
	// Write data in 'Output.txt' .
	fs.writeFile(file, data, (err) => {
		
		// In case of a error throw err.
		if (err) throw err;
	})
}

function readJSON(file){
    let rawdata = fs.readFileSync(file);
    let data = JSON.parse(rawdata);
    return data;
}


//USERS FUNCIONS//

function clearCookies(pedido, respuesta){
  cookies = new Cookies(pedido, respuesta, { keys: keys });
  cookies.set('form',"",{maxAge:0,overwrite:true,secure:true});
}

function newuser(pedido,respuesta) {
    
    let info = '';
    pedido.on('data', datosparciales => {
      info += datosparciales;
    });
    pedido.on('end', () => {

        const formulario = querystring.parse(info);
        
        var newData = new user(formulario['nombre'],formulario['clave'],formulario['email']);

        var data = readJSON('usrs.json');
        var found = false;

        data.forEach(element => {
            if(element.usr == newData.usr){
                found = true;
            }
        });

        if(!found){
          newData.pwd = crypto.pbkdf2Sync(newData.pwd, 'salt', 100000, 64, 'sha512').toString('hex');
          data.push(newData);
          save('usrs.json',data);
        }
        respuesta.writeHead(200, {'Content-Type': 'text/html'});
        const pagina=
          header +
          `
           User name:${newData.usr}<br>
           Email:${newData.email}<br>
           Password:${formulario['clave']}<br><br>
          <a href="index.html">Return</a>
          `
          +feeter;
          
          
        respuesta.end(pagina);
      });
      
}

function edituser(pedido,respuesta) {

  cookies = new Cookies(pedido, respuesta, { keys: keys });
  let info = '';
  pedido.on('data', datosparciales => {
    info += datosparciales;
  });
  pedido.on('end', () => {
      const formulario = querystring.parse(info);
      var newPwd = "";
      if(formulario['clave'] != ""){
        newPwd = crypto.pbkdf2Sync(formulario['clave'], 'salt', 100000, 64, 'sha512').toString('hex');
      }
      var newData = new user(formulario['nombre'],newPwd,formulario['email']);

      var data = readJSON('usrs.json');
      var found = false;
      
      data.forEach(element => {
        
        if(element.usr == newData.usr){
          if(newPwd != ""){element.pwd = newData.pwd;}
          formulario["clave"] = element.pwd;
          element.email = newData.email;
          found = true;
        }
      });

      if(found){
        save('usrs.json',data);
        cookies.set('form', JSON.stringify(formulario), { signed: true });
      }

      respuesta.writeHead(200, {'Content-Type': 'text/html'});
      const pagina=
        header+
        `
         User:${formulario['nombre']}<br>
        Saved<br><br>
        <a href="index.html">Return</a>
        <a href="login">Edit</a>
        `
        +feeter;
        
        
      respuesta.end(pagina);
    });
    
}

function login(pedido,respuesta) {  
  cookies = new Cookies(pedido, respuesta, { keys: keys });

  let info = '';
    pedido.on('data', datosparciales => {
      info += datosparciales;
    });
    pedido.on('end', () => {
        var formulario = {
          "nombre" : "",
          "clave" : "",
          "email" : "",
        };// = JSON.parse(cookies.get('form', { signed: true }));
        if(info) {
          formulario = querystring.parse(info);
          if(formulario['clave']){
            formulario['clave'] =crypto.pbkdf2Sync(formulario['clave'], 'salt', 100000, 64, 'sha512').toString('hex');
          }
          cookies.set('form', JSON.stringify(formulario), { signed: true });
        }
        else if (cookies.get('form', { signed: true }) != null){
          formulario = JSON.parse(cookies.get('form', { signed: true }) || "");
        }
        else{
          var miUrl= new URL(`http://${host}:${pedido.url}`);
          if (miUrl.searchParams.has('usr')) formulario['nombre'] = miUrl.searchParams.get('usr');
          if (miUrl.searchParams.has('pwd')) formulario['clave'] = miUrl.searchParams.get('pwd');
          if (miUrl.searchParams.has('email')) formulario['email'] = miUrl.searchParams.get('email');
        }
        cookies.set('user', formulario['nombre'], { signed: true });
        
        var newData = new user(formulario['nombre'],formulario['clave'],formulario['email']);
        
        var data = readJSON('usrs.json');
        var found = false;

        data.forEach(element => {
            if(element.usr == newData.usr && element.pwd == newData.pwd){
              newData.equals(element); 
              found = true;
            }
        });
        respuesta.writeHead(200, {'Content-Type': 'text/html'});
        var pagina;
        if(found){

          pagina= 
          header+
          `
            <form action="edituser" method="post">
            <br>User name: ${newData.usr}<br>
              <input type="hidden" type="text" name="nombre" size="60" value = ${newData.usr}><br>
              Email:<br>
              <input type="text" name="email" size="60" value = ${newData.email} required><br>
              Password:<br>
              <input type="password" name="clave" size="60" value = ""><br>
              <input type="submit" value="Editar">
              <a href="index.html">Return</a>
              <a href="logout">Logout</a>
            </form>
          `
          +feeter
        }
        else{
          pagina= 
          header+
          `
            Incorrect Login<br><br>

            User name:${formulario['nombre']}<br>
            Found:${found}<br><br>

            user or password not found<br><br>               
            <a href="index.html">Return</a>
          `
          +feeter
        }
          
          
        respuesta.end(pagina);
      });
      
}

function sendpassword(pedido,respuesta){
  let info = '';
  pedido.on('data', datosparciales => {
    info += datosparciales;
  });
  pedido.on('end', () => {
      var formulario;// = JSON.parse(cookies.get('form', { signed: true }));

      formulario = querystring.parse(info);

      var usr = formulario['nombre']
      
      var data = readJSON('usrs.json');
      var found = false;
      var newData = new user();

      data.forEach(element => {
          if(element.usr == usr){
            newData.equals(element); 
            found = true;
          }
      });
      respuesta.writeHead(200, {'Content-Type': 'text/html'});
      var pagina;
      if(found){

        mailOptions.to = newData.email;
        mailOptions.text = ""+host+":"+port+"/login?"+newData.toQuerryString();
        transporter.sendMail(mailOptions, (error, info) => {
          if(error){
            console.log(error);
          }
          else{
            console.log("enviado");
          }
        });

        pagina= header+
        `
          <br>
          Email sent <br><br>
          <a href="index.html">Return</a>
        `
        +feeter
      }
      else{
        pagina= header+
        `
          <br>
          Incorrect User<br><br>                 
          <a href="index.html">Return</a>
        `
        +feeter
      }
        
        
      respuesta.end(pagina);
    });
}

function logout(pedido,respuesta){
  cookies = new Cookies(pedido, respuesta, { keys: keys });

  let info = '';
    pedido.on('data', datosparciales => {
      info += datosparciales;
    });
    pedido.on('end', () => {
      cookies.set('form', "", { overwrite:true , signed:true, maxAge:0 });
      respuesta.writeHead(200, {'Content-Type': 'text/html'});
      var pagina;

        pagina= 
        header+
        `
          Loged out <br><br>
            <a href="index.html">Return</a>
            <a href="logout">Logout</a>
        `
        +feeter
        
        
      respuesta.end(pagina);
    });
}


//SERVER//

const mime = {
  'html' : 'text/html',
  'css'  : 'text/css',
  'jpg'  : 'image/jpg',
  'ico'  : 'image/x-icon',
  'mp3'  : 'audio/mpeg3',
  'mp4'  : 'video/mp4'
};

const servidor=http.createServer((pedido ,respuesta) => {
   const objetourl = url.parse(pedido.url);
 let camino='public'+objetourl.pathname;
 if (camino=='public/')
   camino='public/index.html';
 encaminar(pedido,respuesta,camino);
 cookies = new Cookies(pedido, respuesta, { keys: keys });
});

function encaminar (pedido,respuesta,camino) {
  //console.log(camino);
  switch (camino) {
    case 'public/newuser': {
      newuser(pedido,respuesta);
      break;
    }	
    case 'public/login': {
      login(pedido,respuesta);
      break;
    }	
    case 'public/edituser': {
      edituser(pedido,respuesta);
      break;
    }	
    case 'public/sendpassword': {
      sendpassword(pedido,respuesta);
      break;
    }	
    case 'public/logout': {
      logout(pedido,respuesta);
      break;
    }	
    default : {  
      fs.stat(camino, error => {
        if (!error) {
        fs.readFile(camino,(error, contenido) => {
          if (error) {
            respuesta.writeHead(500, {'Content-Type': 'text/plain'});
            respuesta.write('Error interno');
            respuesta.end();					
          } else {
            const vec = camino.split('.');
            const extension=vec[vec.length-1];
            const mimearchivo=mime[extension];
            respuesta.writeHead(200, {'Content-Type': mimearchivo});
            respuesta.write(contenido);
            respuesta.end();
          }
        });
      } else {
        respuesta.writeHead(404, {'Content-Type': 'text/html'});
        respuesta.write(header+'Recurso inexistente'+feeter);		
        respuesta.end();
        }
      });	
    }
  }	
}

servidor.listen(port);

console.log('Web Server Iniciated');

