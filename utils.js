const items = require('./items.json')
const Order = require('./order')

function listItems(orders, menu) {
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

    menu.mainMenu = false;
    menu.subMenu = true;

    response.message = output
    return response;
}

function placeOrder(msg, orders, menu) {
  let response = {}; 
   if (msg == 0) {
      menu.mainMenu = true;
      menu.subMenu = false;
      response.message = options;
      return response;
   }


   for (let i = 0; i < items.length; i++) {
     if (msg == items[i].menuOption) {
      
      menu.mainMenu = true;
      menu.subMenu = false;
       
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


module.exports = {
    listItems,
    placeOrder,
    checkoutOrder,
    getOrderHistory,
    getCurrentOrder,
    cancelOrder
}