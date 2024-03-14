const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const session = require('express-session')
const sharedsession = require("express-socket.io-session");

require('dotenv').config()

app.set('trust proxy', 1) 

const sess = {
  name: 'restaurant chatbot',
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 48 * 60 * 60 * 1000 }
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

const expressSession = session(sess)

 
// Use express-session middleware for express
app.use(expressSession);
 
// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(expressSession, {
    autoSave:true
})); 

const options = `Main menu
  Select 1 to Place an order
  Select 99 to checkout order
  Select 98 to see order history
  Select 97 to see current order
  Select 0 to cancel order
`

let menu = {
   mainMenu: true,
   subMenu: false
}

const { listItems, placeOrder, checkoutOrder, getOrderHistory, getCurrentOrder, cancelOrder} = require('./utils')


const input = {
    1(orders) {
      return listItems(orders, menu)
    },
    99(orders) {
      return checkoutOrder(orders)
    },
    98(orders) {
      return getOrderHistory(orders)
    },
    97(orders) {
      return getCurrentOrder(orders)
    },
    0(orders) {
      return cancelOrder(orders)
    },
}

app.get('/', (req, res) => {
  if (!req.session.orders) {
    req.session.orders = []
  }
  
  res.sendFile(__dirname + '/index.html');

});


io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('send options', options)
  
  if (!socket.handshake.session.orders) socket.handshake.session.orders = []

  socket.on('send message', msg => {
    const { orders } = socket.handshake.session;
    let response = {};

    if (menu.mainMenu) {
      if (!input[msg] && menu.mainMenu) {
        response.message = "Invalid value entered"
      } else response = input[msg](orders)
    } else response = placeOrder(msg, orders, menu)
    
     socket.emit('send response', response.message)

     if (response.sendOptions) {
      socket.emit('send options', options, 300)
     }
  })
  
});

server.listen(3500, () => {
  console.log('listening on *:3500');
});