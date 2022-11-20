const express = require('express');
const { info } = require('console');
const app = express();
const port = 5000;

app.use(express.static('public'));

var BotController = require('./bot_control.js');
var BotInfo = BotController.BotGroups;

const { initBotData, mainLoop } = require('./bot_control.js');

app.get('/info', (req, res) => 
{
    const { dynamic } = req.params;
    const { key } = req.query;
    console.log(dynamic, key);
    const params = { info: BotInfo[0]._botGroupName };
    res.status(200).json.toString({ params })
})

app.listen(port, () => console.log("Server has started"));
initBotData();
mainLoop();