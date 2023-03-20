const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const items = require('./items.json')
const Order = require('./order')

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
    1() {
      return listItems(items)
    },
    99() {
      return checkoutOrder()
    },
    98() {
      return "hi"
    },
    97() {
      return "hi"
    },
    0() {
      return "hi"
    },
}



function listItems(items) {
    let output = []

    for (let i = 0; i < items.length; i++) {
      output[i] = `Select ${items[i].menuOption} to buy ${items[i].name} at ${items[i].price}`
    }

    let lastItem = output.length - 1
    output[lastItem + 1] = `Select 0 to go back to main menu`

    mainMenu = false;
    subMenu = true;

    return output
}

function placeOder(msg) {

   if (msg == 0) {
      mainMenu = true;
      subMenu = false;
      return options
   }

   

   for (let i = 0; i < items.length; i++) {
     if (msg == items[i].menuOption) {
      console.log("hi", msg, items)
      mainMenu = true;
      subMenu = false;
       return `${items[i].name} selected, Kindly checkout to place order`
     }
     return `Invalid response, please see numbers allowed`
   }
}

function checkoutOrder() {
   const order = new Order;
   return "order placed"
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.emit('send options', options)

  socket.on('send message', msg => {
    let response;

    if (mainMenu) {
      if (!input[msg]) {
        response = "Invalid value entered"
      } else response = input[msg]()
    } else response = placeOder(msg, socket)
    
     socket.emit('send response', response)
  })
  
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});