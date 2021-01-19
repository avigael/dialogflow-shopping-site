const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express();
const fetch = require("node-fetch");
const base64 = require("base-64");

let username = "";
let password = "";
let token = "";

let ENDPOINT_URL = "https://avigael-shop-fitness.herokuapp.com";

async function getToken() {
  let request = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + base64.encode(username + ":" + password),
    },
    redirect: "follow",
  };

  const serverReturn = await fetch(ENDPOINT_URL + "/login", request);
  const serverResponse = await serverReturn.json();

  if (serverResponse.message === "Could not verify") {
    token = "fail";
  } else {
    token = serverResponse.token;
  }

  return token;
}

async function agentMessage(message) {
  await fetch(ENDPOINT_URL + "/application/messages/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify({
      isUser: false,
      text: message,
    }),
  });
}

async function userMessage(message) {
  await fetch(ENDPOINT_URL + "application/messages/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify({
      isUser: true,
      text: message,
    }),
  });
}

async function clearMessages() {
  await fetch(ENDPOINT_URL + "application/messages/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });
}

app.get("/", (req, res) => res.send("online"));
app.post("/", express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function welcome() {
    agent.add("Webhook works!");
    console.log(ENDPOINT_URL);
  }

  async function login() {
    username = agent.parameters.username;
    password = agent.parameters.password;
    token = await getToken();

    await clearMessages();
    await userMessage(agent.query);

    await fetch(ENDPOINT_URL + "/application", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({ page: "/" + username }),
    });

    let message = "Welcome! You are logged in as " + username + ".";
    await agentMessage(message);

    if (isLoggedIn()) {
      agent.add(message);
    } else {
      agent.add("Log in failed!");
    }
  }

  async function askLogin() {
    await userMessage(agent.query);
    let message = "No, you aren't logged in.";
    if (isLoggedIn()) {
      message = "Yes, you are logged in as " + username + ".";
    }
    await agentMessage(message);
    agent.add(message);
  }

  function isLoggedIn() {
    if (token === "fail" || token === "") {
      return false;
    }
    return true;
  }

  async function getCategories() {
    await userMessage(agent.query);
    await fetch(ENDPOINT_URL + "/categories", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        printCategories(data);
      });
  }

  async function printCategories(data) {
    let categories = data["categories"];
    let message = "The categories our store offers include: ";
    for (let i = 0; i < categories.length - 1; i++) {
      message += categories[i] + ", ";
    }
    message += "and " + categories[categories.length - 1] + ".";
    agent.add(message);
    await agentMessage(message);
  }

  async function getCategoryTags() {
    await userMessage(agent.query);
    let category = agent.parameters.category;
    let link = ENDPOINT_URL + "/categories/" + category + "/tags";
    await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        printCategoryTags(data, category);
      });
  }

  async function printCategoryTags(data, category) {
    let tags = data["tags"];
    let message = "The tags for " + category + " include: ";
    for (let i = 0; i < tags.length - 1; i++) {
      message += tags[i] + ", ";
    }
    message += "and " + tags[tags.length - 1] + ".";

    agent.add(message);
    await agentMessage(message);
  }

  async function queryProduct() {
    await userMessage(agent.query);
    let message = "I need to know the specific item you're looking for.";
    let id = agent.parameters.id;
    let page = getPage(id);
    if (page !== "invalid") {
      await fetch(ENDPOINT_URL + "/application", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          page: "/" + username + "/" + page + "/products/" + id,
        }),
      });
      message = "I have navigated you to this item's product page.";
    }
    agent.add(message);
    await agentMessage(message);
  }

  function getPage(id) {
    let hats = ["10", "11"];
    let sweatshirts = ["2", "13"];
    let plushes = ["3", "5", "7", "8", "9"];
    let leggings = ["4", "6"];
    let tees = ["12"];
    let bottoms = ["14", "15", "16", "17"];

    if (hats.includes(id)) {
      return "hats";
    } else if (sweatshirts.includes(id)) {
      return "sweatshirts";
    } else if (plushes.includes(id)) {
      return "plushes";
    } else if (leggings.includes(id)) {
      return "leggings";
    } else if (tees.includes(id)) {
      return "tees";
    } else if (bottoms.includes(id)) {
      return "bottoms";
    } else {
      return "invalid";
    }
  }

  async function queryProductInfo() {
    await userMessage(agent.query);
    let id = agent.parameters.id;
    let request = agent.parameters.info;
    if (id === "1") {
      id = await getCurrentId();
    }
    if (request === "reviews") {
      id += "/reviews";
    }
    let link = ENDPOINT_URL + "/products/" + id;
    if (id !== 0) {
      await fetch(link, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          printProductInfo(data, request);
        });
    } else {
      let message = "You must specify an item to get information on it.";
      agent.add(message);
      await agentMessage(message);
    }
  }

  async function printProductInfo(data, request) {
    let info = data[request];
    let message = "It appears your request is invalid.";
    if (request === "category") {
      message = "This item belongs to the " + info + " category.";
    } else if (request === "description") {
      message = "Here is the description for this item: " + info;
    } else if (request === "name") {
      message = "The name of this item is " + info;
    } else if (request === "price") {
      message = "The price of this item is $" + info;
    } else if (request === "reviews") {
      let stars = 0;
      for (let i = 0; i < info.length; i++) {
        stars = info[i].stars;
      }
      message = "This product has a " + stars + " rating.";
    }
    agent.add(message);
    await agentMessage(message);
  }

  async function getCart() {
    let request = agent.parameters.cartrequest;
    await userMessage(agent.query);
    await fetch(ENDPOINT_URL + "/application/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        printCart(data, request);
      });
  }

  async function printCart(data, request) {
    let items = data["products"];
    console.log(items);
    let message = "There is currently nothing in your cart.";
    if (items.length > 0) {
      if (request === "category") {
        message = "The types of items in your cart are ";
        for (let i = 0; i < items.length - 1; i++) {
          message += items[i].category + ", ";
        }
        if (items.length === 1) {
          message += items[0].category + ".";
        } else {
          message += "and " + items[items.length - 1].category + ".";
        }
      } else if (request === "price") {
        message = "Your current total is ";
        let dollars = 0;
        for (let i = 0; i < items.length; i++) {
          dollars += items[i].price * items[i].count;
        }
        message += "$" + dollars + ".";
      } else if (request === "amount") {
        message = "There are a total of ";
        let total = 0;
        for (let i = 0; i < items.length; i++) {
          total += items[i].count;
        }
        message += total + "  item(s) in the cart.";
      } else if (request === "names") {
        message = "You have ";
        for (let i = 0; i < items.length - 1; i++) {
          message += items[i].name + ", ";
        }
        if (items.length === 1) {
          message += items[0].name + " in your cart";
        } else {
          message += "and " + items[items.length - 1].name + " in your cart";
        }
      }
    }
    agent.add(message);
    await agentMessage(message);
  }

  async function addCart() {
    await userMessage(agent.query);
    let id = agent.parameters.id;
    let number = agent.parameters.number;
    let message = "Please specify or select an item to add.";
    if (id === "1") {
      id = await getCurrentId();
    }
    if (!(number > 0)) {
      number = 1;
    }
    if (id !== 0) {
      for (let i = 0; i < number; i++) {
        let link = ENDPOINT_URL + "/application/products/" + id;
        await fetch(link, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
          },
        });
      }
      message = "I added " + number + " item(s) to your cart.";
    }
    agent.add(message);
    await agentMessage(message);
  }

  async function removeCart() {
    await userMessage(agent.query);
    let id = agent.parameters.id;
    let number = agent.parameters.number;
    let message = "Please specify or select an item to remove.";
    if (id === "1") {
      id = await getCurrentId();
    }
    if (!(number > 0)) {
      number = 1;
    }
    if (id !== 0) {
      for (let i = 0; i < number; i++) {
        let link = ENDPOINT_URL + "/application/products/" + id;
        await fetch(link, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
          },
        });
      }
      message = "I removed " + number + " item(s) from your cart.";
    }
    agent.add(message);
    await agentMessage(message);
  }

  async function clearCart() {
    await userMessage(agent.query);
    await fetch(ENDPOINT_URL + "/application/products/", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    let message = "I removed every item in your cart.";
    agent.add(message);
    await agentMessage(message);
  }

  async function reviewCart() {
    await userMessage(agent.query);
    await fetch(ENDPOINT_URL + "/application", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({ page: "/" + username + "/cart-review" }),
    });
    let message =
      "Please review your cart then click confirm. Thanks for shopping!";
    agent.add(message);
    await agentMessage(message);
  }

  async function applyTag() {
    await userMessage(agent.query);
    let tag = agent.parameters.tag;
    let link = ENDPOINT_URL + "/application/tags/" + tag;
    await fetch(link, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    let message = "I've applied the " + tag + " tag.";
    agent.add(message);
    await agentMessage(message);
  }

  async function removeTag() {
    await userMessage(agent.query);
    let tag = agent.parameters.tag;
    let link = ENDPOINT_URL + "/application/tags/" + tag;
    await fetch(link, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });
    let message = "I've removed the " + tag + " tag.";
    agent.add(message);
    await agentMessage(message);
  }

  async function getCurrentId() {
    return await fetch(ENDPOINT_URL + "/application", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        let path = data["page"];
        let parse = path.split("/");
        let id = parse[parse.length - 1];
        if (!(id > 0)) {
          id = 0;
        }
        return id;
      });
  }

  async function navigation() {
    await userMessage(agent.query);
    let page = agent.parameters.page;
    if (page === "home") {
      page = "";
    }
    await fetch(ENDPOINT_URL + "/application", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({ page: "/" + username + "/" + page }),
    });
    if (page === "") {
      page = "home";
    }
    let message = "I have redirected you to the " + page + " page.";
    agent.add(message);
    await agentMessage(message);
  }

  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  intentMap.set("Login", login);
  intentMap.set("Query Login", askLogin);
  intentMap.set("Query Categories", getCategories);
  intentMap.set("Query Category Tags", getCategoryTags);
  intentMap.set("Query Cart", getCart);
  intentMap.set("Query Product", queryProduct);
  intentMap.set("Query Product Info", queryProductInfo);
  intentMap.set("Action Add Item", addCart);
  intentMap.set("Action Remove Item", removeCart);
  intentMap.set("Action Clear Cart", clearCart);
  intentMap.set("Action Review Cart", reviewCart);
  intentMap.set("Action Apply Tag", applyTag);
  intentMap.set("Action Remove Tag", removeTag);
  intentMap.set("Navigation", navigation);
  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);
