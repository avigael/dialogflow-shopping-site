import React from "react";
import ReactDOM from "react-dom";
import "./styles/index.css";
import "./styles/app.scss";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

window.$USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint

window.$ENDPOINT_URL = "https://avigael-shop-fitness.herokuapp.com";

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
