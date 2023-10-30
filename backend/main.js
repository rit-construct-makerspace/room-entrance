// const GPIO = require('onoff').Gpio;
import cors from "cors";
import express from "express";
import path from "path";
import * as fs from "fs";

const app = express();
const port = 3001;

const ROOM_ID = 1; //main lab

app.use(cors());
app.use(express.json());

const buildPath = path.join(__dirname, "../frontend/build")

app.use(express.static(buildPath));


/**Function to write to log-file.txt */
function writeToFile(data) {
    fs.open('log_file.txt', 'a', function(err, file) {
        if (err) {console.error(err);}
        fs.write(file, data, function(err) {
            if (err) {console.error(err);}
            fs.close(file, function(err){
                if (err) {console.error(err);}
            });
        });
    });
}


/**Recieve message from Frontend to write to Log-file */
app.post('/writeToFile',(req, resp) => {
    //console.log(req.body.data);
    writeToFile(req.body.data);
    resp.send("true")
    //resp.status(200)
});

/**
 * This api endpoint allows this server to act as a proxy to connect to the graphql server
 * this proxy is required to solve cors issues that occur when querying the graphQL from a statically served website
 *
 */
app.post('/forwardRequest', (req, res) => {
    const server_url = "https://constructcontrol.herokuapp.com/graphql";

    const swipeIntoRoomMutation = `
    mutation SwipeIntoRoom($roomId: ID!, $universityId: String!) {
        swipeIntoRoom(roomID: $roomId, universityID: $universityId) {
            ritUsername
        }
    }
    `;

    const validUid = req.body.id

    const body =  {
        operationName: "swipeIntoRoom",
        mutation: swipeIntoRoomMutation,
        variables: {"roomId": EQUIPMENT_ID, "universityId": validUid}
    }
    const options = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    var firstname;

    const request = new Request(server_url, {
        method: "POST",
        body: body, //Might not need to stringify but doing it to be safe
    });


    fetch(request)
        .then((response) => {
            if (response.status === 200) {
                firstname = response.data.swipeIntoRoom;
            } else {
                console.log("response:", response)
                throw new Error("Issue connecting to GraphQL Server: " + response.status);
            }
        })

    res.json({"name":firstname});

})

/**
 * This serves the built index.html to localhost:3001
 */
app.get('*', async (req, res, next) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});


