import { Type } from "./type";
// constants
const VOTE_CLIENT = "vote-client.github.io";
const WEBSOCKET = "heroku.url";
const LOCALHOST = "localhost:8000";
const LOCALWS = "ws://localhost:8001/";
const VOTE_WEIGHT = 1;
const YES = "yes";
const NO = "no";
const CLIENT_STATE = {
  question: "",
  vote_allowed: true,
};

// #Make connection to Websocket Handler
function getWebSocketServer() {
  if (window.location.host === VOTE_CLIENT) {
    return WEBSOCKET;
  } else if (window.location.host === LOCALHOST) {
    return LOCALWS;
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Open the WebSocket connection and register event handlers.
  const websocket = new WebSocket(getWebSocketServer());
  receiveData(websocket);
});

function getCurrentState(message) {
  curr_question = message.game_state.curr_question;
  CLIENT_STATE = { ...CLIENT_STATE, question: curr_question };
}

function sendClientVote(websocket, decision) {
  sendData(websocket, {
    type: Type.vote,
    vote_decision: decision,
    vote_weight: VOTE_WEIGHT,
  });
}

const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const voteSubmitted = document.getElementById("voteSubmitted");
const question = document.getElementById("question");

//revisit this
function disableVoting() {
  yesButton.disabled = true;
  noButton.disabled = true;
  question.textContent = "Your vote has been submitted!";
  voteSubmitted.style.display = "block";
}

yesButton.addEventListener("click", function () {
  disableVoting();
  sendClientVote(LOCALWS, YES);
  console.log("Voted Yes");
});

noButton.addEventListener("click", function () {
  disableVoting();
  sendClientVote(LOCALWS, NO);
  console.log("Voted No");
});

function receiveData(websocket) {
  websocket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    switch (message.type) {
      case "official":
        getCurrentState(message);
        break;
      default:
        "Something Went wrong!";
    }
  });
}

function sendData(websocket, message) {
  if (websocket.readyState === WebSocket.OPEN) {
    if (typeof message === "object") {
      message = JSON.stringify(message);
    } else {
      console.log("Need to send an object for json");
      return;
    }
    websocket.send(message);
    console.log("Message sent to server:", message);
  } else {
    console.error("WebSocket is not open. ReadyState:", websocket.readyState);
  }
}
