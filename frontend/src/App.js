import React, {useState, useEffect} from "react";
import axios from "axios";
import "./App.css";


const App = () => {

  //gpio local backend url
  const writeBackend = "http://localhost:3001/writeToFile"
  const graphqlForwardingBackend = "http://localhost:3001/forwardRequest"

  //constant length of a university ID num
  const UNFORMATTED_MAG_UID_LENGTH = 15   //i.e. ;XXXXXXXXXXXXXX
  const UNFORMATTED_RFID_UID_LENGTH = 9   //i.e. 0XXXXXXXXX

  //constant for time
  const MINUTES = 60                  // 1 min = 60 sec
  const HOUR = 60*MINUTES             // 1 hr = 60 min
  const USER_TIME_FRAME = 1*MINUTES/20   // Time that user logged in flashes for (5 seconds)


  //This piece of state contains the text currently
  //  dispalyed in uid-textbox
  const [uidInput, setUidInput] = useState('')

  //This piece of state contains the text for the "User has access" element
  const [output, setOutput] = useState('')

  //state contains current user
  const [currUser, setUser] = useState('')


  //Count time user is logged in
  const [userTime, setUserTime] = useState(0)
  const [timeSecond, setSecond] = useState("00")
  const [timeMinute, setMinute] = useState("00")


  /**This function is called every time the uid-textbox is updated*/
  const checkUid = (uidTemp) => {

    if(uidTemp[0] === '?'){
      uidTemp = "";
      setUidInput("");
    }

    setUidInput(uidTemp); //echo uid to textbox
    //check for valid input
    if(uidTemp[0] === ";" && uidTemp.length === UNFORMATTED_MAG_UID_LENGTH){
      ProccessUID(uidTemp.slice(1, 10));
      setUidInput("");
    } else if(uidTemp[0] === "0" && uidTemp.length === UNFORMATTED_RFID_UID_LENGTH){
      ProccessUID(uidTemp.slice(1, 10));
      setUidInput("");
    }
    else if (uidTemp[0] !== ";" &&  uidTemp[0] !== "0" && uidTemp.length === UNFORMATTED_RFID_UID_LENGTH){
      setUidInput('');
      setOutput("Invalid Swipe");
    }
  }

  /**This function process the university ID
   *   if no current user, set user
   *   else if current user rescans card, reset logout timer
   *   else process new user overide
   * Parameter: validUid - 9-digit University ID for user accessing machine
   */
  function ProccessUID(validUid){
    //if no user is currently logged in, begin process to login
    if (currUser === ""){
      sendQuery(validUid);
    }
  }

  /**Function allows Frontend to write to the log in the Backend */
  // function writeToBack(msg){
  //   // axios.post(writeBackend, {data: msg})
  //   //     .then(response => {
  //   //       console.log('Write Success ', Boolean(response.data))
  //   //     });

  //   try {
  //     fs.open('log_file.txt', 'a', function (err, file) {
  //       fs.write(file, msg, function (err) {
  //         fs.close(file, function (err) {
  //         });
  //       });
  //     });
  //   } catch (error){
  //     console.error(error)
  //   }
  // }

  /**This function is called when the uid state is updated
   *   It queries the proxy server by sending the uid and machine id
   *   to the server, then sets the output state based on the response
   * Parameter: validUid - 9-digit University ID for user accessing machine
   */
  const sendQuery = (validUid) => {

    const body =  {"id": validUid}

    const options = {
      headers: {
        'Content-Type': 'application/json'
      }
    }

    var firstname;
    // axios.post(graphqlForwardingBackend, body, options)
    //     .then(resp => (firstname=Boolean(resp.data)))     // set access variable to match the query response
    //     .catch(error =>console.error(error))

    firstname = 'Max';

    if (firstname !== '') {
      loginUID(validUid);

      var currentdate = new Date();
      var datetime = "User Swiped: " + currentdate.getDate() + "/"
          + (currentdate.getMonth()+1)  + "/"
          + currentdate.getFullYear() + " @ "
          + currentdate.getHours() + ":"
          + currentdate.getMinutes() + ":"
          + currentdate.getSeconds()
          + '\n';


      console.log("WRITE TO BACK")
      //writeToBack(datetime);
      writeToBack(currentdate.toString())
    }
    else {
      setOutput("User Recognized");
      setUidInput('');
    }
  }

  //send http request to express server to log time of swipe
  function writeToBack(timeOfSwipe) {
    fetch(writeBackend, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data:timeOfSwipe}),
    })
        .then(response => response.json())
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.error('Error:', error);
        });
  }

  /**Log in a current user */
  function loginUID(validUid) {
    //reset the uid textbox
    setUidInput('');
    setOutput("SUCCESS");
    setUser(validUid);
    document.body.style.background = "limegreen";
    document.body.style.animation = "flash 0s";
    //document.getElementById("UIDinput").style.background = "Crimson";
    //document.getElementById("UIDinput").style.color = "Crimson";
    document.getElementById("UIDinput").style.animation = "flash 0s";
  }

  /**Remove current user a.k.a Log out */
  function logoutUID() {
    setUser('');
    setOutput('');
    setUserTime(USER_TIME_FRAME);
    document.body.style.background = "#F76902";
    document.body.style.animation = "flash 0s";
    document.getElementById("UIDinput").style.background = "#F76902";
    document.getElementById("UIDinput").style.color = "#F76902";
    document.getElementById("UIDinput").style.animation = "flash 0s";
  }


  /**Timers count down while there exists a current user */
  useEffect(() => {
    // create a interval and get the id
    const secInterval = setInterval(() => {
      if (currUser !== "") {
        setUserTime((userTime !== 0) ? ((prevTime) => prevTime - 1) : 0);
      }
    }, 1000);
    // clear out the interval using it id when unmounting the component
    return () => clearInterval(secInterval);
  }, [currUser]);

  /**Auto Logout Current user when userTime == 0
   *   Keep Count of User Time
   */
  useEffect(() => {
    if (userTime === 0) {
      logoutUID();
    }

    //update user time in html
    let min = Math.floor(userTime/60);
    let sec = userTime%60;
    setSecond(sec > 9 ? sec : '0' + sec);
    setMinute(min > 9 ? min : '0' + min);
  }, [userTime]);



  function simulateSwipe() {
    checkUid(';XXXXXXXXXXXXXX')
  }

  //HTML Output
  return(
      <div className="acs-parent">
        <div className="header">
          <div className="uid-textbox">
            <input id="UIDinput" autoFocus="autofocus" value={uidInput} onChange={(event) => checkUid(event.target.value)} />
          </div>
        </div>
        {/*<img src={require("../assets/logo.png")}/>*/}
        <div>
          Welcome to the SHED Makerspace!
        </div>
        <div className="server-response">
          {output.length > 0 ? (<p>{output}</p>) : (<p>Swipe or Tap ID</p>)}
        </div>
        <div className="user-time"> {userTime > 0 ? (<p>{timeMinute}:{timeSecond}</p>) : (<p>Timed Out</p>)} </div>
        {/*<button onClick={simulateSwipe}>SWIPE</button>*/}

        <div>
          Please swipe your ID with the strip facing you
        </div>
        <img src={"../public/leftArrow.png"}/>

      </div>
  )
}
export default App