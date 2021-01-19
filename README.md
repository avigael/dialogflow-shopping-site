# DialogFlow Shopping Website

This website uses [DialogFlow](https://cloud.google.com/dialogflow/ "DialogFlow") an intuitive omnichannel conversational AI.

![Website](https://raw.githubusercontent.com/avigael/dialogflow-shopping-site/main/preview/screenshot.png "Website")

This is a shopping website that allow you to navigate, enquire about items, and add them to your cart using only [DialogFlow](https://cloud.google.com/dialogflow/ "DialogFlow") using natural language. The front-end is built using React and Bootstrap and the back-end is built in Python using Flask. Authentication is done via tokens.

**Disclaimer**: The DialogFlow ShopBot does not have a very large training set so every now and then the bot may correct sentences incorrectly.

![Gif](https://raw.githubusercontent.com/avigael/dialogflow-shopping-site/main/preview/demo.gif "Gif")

## How to Run

**Download Repository**

```
$ git clone https://github.com/avigael/dialogflow-shopping-site.git
$ cd dialogflow-shopping-site
$ npm install
```

**Set up DialogFlow**

* Go to Settings in DialogFlow and go to Export and Import Tab

* Click Restore and upload `ShotBot.zip` found in the `/DialogFlow` folder

![DialogFlow Import](https://raw.githubusercontent.com/avigael/dialogflow-shopping-site/main/preview/dialogflow_import.png "DialogFlow Import")

**Set up Webhook**
*Run in seperate terminals simultaneously*
```
$ npm run tunnel
```

```
$ npm run dev
```

**Copy forwarding Address**

![Terminal](https://raw.githubusercontent.com/avigael/dialogflow-shopping-site/main/preview/terminal_tunnel.png "Terminal")

**Paste into DialogFlow Fufillment Tab**

![DialogFlow Fufillment](https://raw.githubusercontent.com/avigael/dialogflow-shopping-site/main/preview/dialogflow_webhook.png "DialogFlow Fufillment")

**Start Webpage**

```
$ npm start
```

**Note**: To input text you must use the DialogFlow website and it will then update the Shopping Site.