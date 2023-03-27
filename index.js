const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const session = require('express-session')
const sharedsession = require("express-socket.io-session");

const items = require('./items.json')
const Order = require('./order')

require('dotenv').config()

app.set('trust proxy', 1) 

const sess = {
  name: 'restaurant chatbot',
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
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

let mainMenu = true;
let subMenu = false;




const input = {
    1(orders) {
      return listItems(items, orders)
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



function listItems(items, orders) {
    let response = {}
    let output = []

    for (let i = 0; i < orders.length; i++) {
     if (orders[i].isCurrent) {
       response.message = `You cannot place a new order, kindly select 99 to checkout current order`;
       return response;
     }
   }

    for (let i = 0; i < items.length; i++) {
      output[i] = `Select ${items[i].menuOption} to buy ${items[i].name} at ${items[i].price}`
    }

    let lastItem = output.length - 1
    output[lastItem + 1] = `Select 0 to go back to main menu`

    mainMenu = false;
    subMenu = true;

    response.message = output
    return response;
}

function placeOrder(msg, orders) {
  let response = {}; 
   if (msg == 0) {
      mainMenu = true;
      subMenu = false;
      response.message = options;
      return response;
   }


   for (let i = 0; i < items.length; i++) {
     if (msg == items[i].menuOption) {
      
      mainMenu = true;
      subMenu = false;
       
      const order = new Order(items[i].name, items[i].price);
      orders.push(order)

      response.message = `${items[i].name} selected, Kindly checkout to place order - select 99`
      response.sendOptions = true;
      return response;
     }
     
   }

   response.message = `Invalid response, please see numbers allowed`
   return response;

}

function checkoutOrder(orders) {
   let response = {}
   response.sendOptions = true;
   
   for (let i = 0; i < orders.length; i++) {
     if (orders[i].isCurrent) {
       orders[i].isCurrent = false;
       response.message = "order placed"
       return response;
     }
   }

   response.message = "No order to place"
   return response;
}


function getOrderHistory(orders) {
  let response = {};

  let history = []
  for (let i = 0; i < orders.length; i++) {
    if (!orders[i].isCurrent) {
      history.push(`Purchased ${orders[i].name} at ${orders[i].price}`)
    }
  }

  response.sendOptions = true;
  
  if (history.length == 0) response.message =  `No order history`
  else response.message = history;

  return response;
}

function getCurrentOrder(orders) {
  let response = {}
   for (let i = 0; i < orders.length; i++) {
    response.sendOptions = true;
     if (orders[i].isCurrent) {
      response.message = `Your current order is ${orders[i].name} at ${orders[i].price}`
      return response;
     }
   }
   response.message = `No current order`;
   return response;
}

function cancelOrder(orders) {
  let response = {}
  response.sendOptions = true;
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].isCurrent) {
      orders.splice(i, 1)
      response.message = `Your order has been successfully Canceled`;
      return response;
    }
  }

  response.message = `No current order`;
  return response;
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

  socket.on('send message', msg => {
    let response;
    const { orders } =  socket.handshake.session
    if (mainMenu) {
      if (!input[msg]) {
        response = "Invalid value entered"
      } else response = input[msg](orders)
    } else response = placeOrder(msg, orders)
    
     socket.emit('send response', response.message)

     if (response.sendOptions) {
      socket.emit('send options', options, 700)
     }
  })
  
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});