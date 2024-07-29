const VOTE_CLIENT = "vote-client.github.io";
const WEBSOCKET = "heroku.url";
const LOCALHOST = "localhost:8000";
const LOCALWS = "ws://localhost:8001/";
const VOTE_WEIGHT = 1;
const YES = "yes";
const NO = "no";
const IS_ADMIN = false;
const CLIENT_STATE = {
  question: "Hello world",
  vote_allowed: true,
};

class Type {
    static vote = "vote"
}

let websocket;

// #Make connection to Websocket Handler
function getWebSocketServer() {
  if (window.location.host === VOTE_CLIENT) {
    return WEBSOCKET;
  } else if (window.location.host === LOCALHOST) {
    return LOCALWS;
    // #For Local Testing
  } else if (window.location.host === '127.0.0.1:5500'){
    return LOCALWS
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Open the WebSocket connection and register event handlers.
  websocket = new WebSocket(getWebSocketServer());

  //timeout to allow websocket connection
  setTimeout(() => {
    sendCurrentState(websocket)
  }, 50);
  receiveData(websocket);
});

// RECEIVERS
function receiveCurrentState(message) {
  next_question = message.game_state.curr_question;
  CLIENT_STATE.question = next_question;
  //update the current question
  document.getElementById('question').textContent = CLIENT_STATE.question
}

function receiveVoteAllowed(message){
    next_vote_allowed = message.vote_allowed
    next_question = message.curr_question
    CLIENT_STATE.vote_allowed = next_vote_allowed;
    CLIENT_STATE.question = next_question;

    //re-enable voting
    enableVoting()
}

function receiveNoVoteAllowed(message){
    next_vote_allowed = message.vote_allowed
    next_question = message.curr_question
    CLIENT_STATE.vote_allowed = next_vote_allowed;
    CLIENT_STATE.question = next_question;

    disableVoting()
}


//END RECEIVERS

//SENDERS
function sendClientVote(websocket, decision) {
  sendData(websocket, {
    is_admin : IS_ADMIN,
    type: Type.vote,
    vote_decision: decision,
    vote_weight: VOTE_WEIGHT,
  });
}

function sendCurrentState(websocket){
    sendData(websocket, {
        is_admin: IS_ADMIN,
        type: "replay"
    })
}
//END SENDERS

const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const voteSubmitted = document.getElementById("voteSubmitted");
const question = document.getElementById("question");

//revisit this -> make better way to handle this
function disableVoting() {
  yesButton.disabled = true;
  noButton.disabled = true;
  question.textContent = "Your vote has been submitted!";
  voteSubmitted.style.display = "block";
}

function enableVoting(){
    yesButton.disabled = false;
    noButton.disabled = false;
    question.textContent = CLIENT_STATE['question']
    voteSubmitted.style.display = 'none';
}
//end of revisit

yesButton.addEventListener("click", function () {
  disableVoting();
  sendClientVote(websocket, YES);
  console.log("Voted Yes");
});

noButton.addEventListener("click", function () {
  disableVoting();
  sendClientVote(websocket, NO);
  console.log("Voted No");
});

function receiveData(websocket) {
  websocket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    console.log("Response from websocket",message)
    switch (message.type) {
      case "official":
        receiveCurrentState(message);
        break;
      case "vote_allowed":
        if(message["vote_allowed"])receiveVoteAllowed(message);
        else 
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
