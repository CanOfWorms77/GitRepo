const express = require('express');
//const { info } = require('console');
const app = express();
const port = 5000;

app.use(express.static('public'));
app.use(express.json());
const bodyParser = require("body-parser"); 
router.use(bodyParser.json());

var BotController = require('./bot_control.js');
var BotInfo = BotController.BotGroups;

const { initBotData, mainLoop } = require('./bot_control.js');

app.get('/', (req, res) => 
{
    //const { dynamic } = req.params;
    //const { key } = req.query;
    //console.log(dynamic, key);
    //const params = { name: BotInfo };
    //const json_params = json.stringify(params);
    botName = BotGroups[bot_group_no]._botGroupName
    res.status(200).json({info: botName});
})

app.listen(port, () => console.log("Server has started"));
initBotData();
mainLoop();