const threeCommasAPI = require('3commas-api-node')

var http = require('http'); // 1 - Import Node.js core module
var fs = require('fs');

let index = 0
var server = http.createServer(function (req, res) 
{   // 2 - creating server  
    res.write(BotGroups[index]._bot1Id); //write a response to the client
    index++
    if (index > 1) index = 0
    return res.end();
});

const MAX_NO_OF_BOTSPERGROUP = 4;

var BotGroups = [];

// Bot data table - "Bot Group name e.g. BTC", "deviation to start next bot e.g. -5", "Bot1Id", "Bot2Id" "Bot3Id" "Bot4Id",   
var BotDataTable = 
[
  //["LUNA", -0.1, "9711362", "9711367", "9711372", "9717010" ],
  //["LUNC", -0.1, "9711393", "9711399", "9711406", "9717006" ],
  //["ATOM", -0.15, "9728827", "9728847", "9728860", "9728863" ],
  ["CHZ" , -0.2,  '9729998', '9730007', '9730009', '9730012' ],
  ["LAST_ENTRY", null, null, null, null, null ],
] 

//console.log('Node.js web server at port 5000 is running..')

const api = new threeCommasAPI
({
    apiKey: '6d288e0f3f6540498c69cd7ba63358eb867603db3beb45329be096e00027ce98',
    apiSecret: '32b4969b4e012c117f51d20e1dfa531f60a7ba48e3fda1e012cb9f93325ec10ac47821befccd340c67a253ec06b31e2414517e2497f4258554e89c83a6552c75816dcf773fc7932d04f522c4ee423c7fd15eaab524887847f601fc865fa7376baf22d99f'
})

var dealData = null

class botController
{
   constructor()
   {
      this._botGroupName = ""
      this._percentDeviationToStart = 0
      this._bot1Id = 0
      this._bot2Id = 0
      this._bot3Id = 0
      this._bot4Id = 0
      this._dealId_Bot1 = 0;
      this._dealId_Bot2 = 0;
      this._dealId_Bot3 = 0;
      this._dealId_Bot4 = 0;
      this._newDealWaitTime = 0; // Mins
   }
}

// Would be enum in C - but can't be bothered with the node.js equivalent, so just hard code indexes
const BotGroupName = 0
const Deviation = 1
const Bot_1 = 2
const Bot_2 = 3
const Bot_3 = 4
const Bot_4 = 5

const paperAccount = '31967815'
const realAccount = '29678480'

module.exports = botController;

let i = 0
let mainLoopIndex = 0
function mainLoop()
{
    setTimeout(() => 
    {
        runBotEngine()
        mainLoop();
    }, 6000) // 6 secs
}


function botIdDealMatcher(bot_id, dealInfo)
{
    let index = 0
    let found = false
    let deal_id = "No deal found"
    while ((index < dealInfo.length) && (found == false))
    {
        if (dealInfo[index].bot_id == bot_id)
        {
            deal_id = dealInfo[index].id
            found = true
        }
        index++  
    }

    return deal_id
}

const initBotData = async () =>
{      
    // Declare variable to contain deal data
    let dealsData = await api.getDeals({ account_id: paperAccount, scope: 'active' }) 

    // Create bot control instances
    for (let bot_group_no = 0; BotDataTable[bot_group_no][0] != "LAST_ENTRY"; bot_group_no++)
    {
        // Declare objects of bot controller class
        BotGroups[bot_group_no] = new botController()

        BotGroups[bot_group_no]._botGroupName = BotDataTable[bot_group_no][BotGroupName]
        BotGroups[bot_group_no]._percentDeviationToStart = BotDataTable[bot_group_no][Deviation]

        // Initialise data for Bot 1
        BotGroups[bot_group_no]._bot1Id = BotDataTable[bot_group_no][Bot_1];
        BotGroups[bot_group_no]._dealId_Bot1 = botIdDealMatcher(BotGroups[bot_group_no]._bot1Id, dealsData)

        // Initialise data for Bot 2
        BotGroups[bot_group_no]._bot2Id = BotDataTable[bot_group_no][Bot_2];
        BotGroups[bot_group_no]._dealId_Bot2 = botIdDealMatcher(BotGroups[bot_group_no]._bot2Id, dealsData)

        // Initialise data for Bot 3
        BotGroups[bot_group_no]._bot3Id = BotDataTable[bot_group_no][Bot_3];
        BotGroups[bot_group_no]._dealId_Bot3 = botIdDealMatcher(BotGroups[bot_group_no]._bot3Id, dealsData)

        // Initialise data for Bot 4
        BotGroups[bot_group_no]._bot4Id = BotDataTable[bot_group_no][Bot_4];
        BotGroups[bot_group_no]._dealId_Bot4 = botIdDealMatcher(BotGroups[bot_group_no]._bot4Id, dealsData)

        console.log(BotGroups[bot_group_no])                         
    }
}

const runBotEngine = async () =>
{
    // This runs every 5 seconds

    let deal1 = "Not Assigned"
    let deal2 = "Not Assigned"
    let deal3 = "Not Assigned"
    let deal4 = "Not Assigned"

    console.log("=============================================================") 
    console.log("Group name: " + BotGroups[mainLoopIndex]._botGroupName)  
    console.log("=============================================================") 

    if (BotGroups[mainLoopIndex]._dealId_Bot1 != "No deal found")
    {
        deal1 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot1) 
    }
    else
    {
        // Bot 1 should always have deal for the cascading to work
        // so it could be that the bot is off, so enable here
        await api.botEnable(BotGroups[mainLoopIndex]._bot1Id)
        console.log("Enabling Bot 1")
    }

    if (BotGroups[mainLoopIndex]._dealId_Bot2 != "No deal found")
    {
        deal2 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot2) 
    }
    
    if (BotGroups[mainLoopIndex]._dealId_Bot3 != "No deal found")
    {
        deal3 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot3) 
    }

    if (BotGroups[mainLoopIndex]._dealId_Bot4 != "No deal found")
    {
        deal4 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot4) 
    }

    /*********************************************************************************************** */
    /* Cascade start logic                                                                           */
    /*********************************************************************************************** */
    let botEnableFlag = false

    // Check if Bot 2 should be started
    console.log("Bot1 -> Bot2 Cascader Start")
    console.log("===========================") 
    botEnableFlag = botCascaderStart(deal1, deal2, BotGroups[mainLoopIndex]._percentDeviationToStart)
    if (botEnableFlag == true)
    {
        await api.botEnable(BotGroups[mainLoopIndex]._bot2Id)
    }

    botEnableFlag = false

    // Check if Bot 3 should be started
    console.log("Bot2 -> Bot3 Cascader Start")
    console.log("===========================") 
    botEnableFlag = botCascaderStart(deal2, deal3, BotGroups[mainLoopIndex]._percentDeviationToStart)
    if (botEnableFlag == true)
    {
        await api.botEnable(BotGroups[mainLoopIndex]._bot3Id)
    }

    botEnableFlag = false

    // Check if Bot 4 should be started
    console.log("Bot3 -> Bot4 Cascader Start")
    console.log("===========================") 
    botEnableFlag = botCascaderStart(deal3, deal4, BotGroups[mainLoopIndex]._percentDeviationToStart)
    if (botEnableFlag == true)
    {
        await api.botEnable(BotGroups[mainLoopIndex]._bot4Id)
    }

    /*********************************************************************************************** */
    /* Cascade finish logic                                                                           */
    /*********************************************************************************************** */

    let botDisableFlag = false

    console.log("Bot1 -> Bot2 Cascader Finish")
    console.log("============================") 
    botDisableFlag = botCascaderFinish(deal1, deal2)
    if (botDisableFlag == true)
    {
        await api.botDisable(BotGroups[mainLoopIndex]._bot2Id)
    }

    botDisableFlag = false

    console.log("Bot2 -> Bot3 Cascader Finish")
    console.log("============================") 
    botDisableFlag = botCascaderFinish(deal2, deal3)
    if (botDisableFlag == true)
    {
        await api.botDisable(BotGroups[mainLoopIndex]._bot3Id)
    }

    botDisableFlag = false

    console.log("Bot3 -> Bot4 Cascader Finish")
    console.log("============================") 
    botDisableFlag = botCascaderFinish(deal3, deal4)
    if (botDisableFlag == true)
    {
        await api.botDisable(BotGroups[mainLoopIndex]._bot4Id)
    }
    
    // Check for completed deals and set new base order/safety order accordingly

    // Update new Deal Ids here
    // get latest active deal data for this account
    let NewdealsData = await api.getDeals({ account_id: paperAccount, scope: 'active' }) 

    // Update data for Bot 1
    BotGroups[mainLoopIndex]._dealId_Bot1 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot1Id, NewdealsData)

    // Update data for Bot 2
    BotGroups[mainLoopIndex]._dealId_Bot2 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot2Id, NewdealsData)

    // Update data for Bot 3
    BotGroups[mainLoopIndex]._dealId_Bot3 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot3Id, NewdealsData)

    // Update data for Bot 3
    BotGroups[mainLoopIndex]._dealId_Bot4 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot4Id, NewdealsData)

    console.log(BotGroups[mainLoopIndex])                         

    // Reset Loop Index  
    mainLoopIndex++
    if (BotDataTable[mainLoopIndex][0] == "LAST_ENTRY")
    {
        mainLoopIndex = 0;
    }

}

// The Bot Cascader start always work on two bots
// It returns an enable flag as it can't be set in the API from here
function botCascaderStart(botA_dealdata, botB_dealdata, botStartDeviation)
{
    let enable = false
    let bot_no = 0

    // This is for debug purpose
/*    for (let x = 0; x < MAX_NO_OF_BOTSPERGROUP; x++)
    {
        if (BotDataTable[mainLoopIndex][x + 2] == botA_dealdata.bot_id)
        {
            bot_no = x + 1
            console.log("Bot " + bot_no + ":" + botA_dealdata.bot_id)
        }

        if (BotDataTable[mainLoopIndex][x + 2] == botB_dealdata.bot_id)
        {
            bot_no = x + 1
            console.log("Bot " + bot_no + ":" + botB_dealdata.bot_id)
        }
    }*/
    
    if (botA_dealdata != "Not Assigned")
    {
        console.log("Completed safety orders : " + botA_dealdata.completed_safety_orders_count)
        console.log("Max safety orders : " + botA_dealdata.max_safety_orders)  
        // Are all the safety orders filled
        if (botA_dealdata.completed_safety_orders_count == botA_dealdata.max_safety_orders)
        {
            console.log("Max safety orders reached - Start Deviation" + botStartDeviation)  
            if (botA_dealdata.actual_profit_percentage <= botStartDeviation)
            {
                console.log("Actual profit : " + botA_dealdata.actual_profit_percentage)  
                // Is there a already deal running on bot2, if not start the bot
                if (botB_dealdata == "Not Assigned")
                {
                    enable = true
                }
            }
        }
    }
    else
    {
        console.log("Bot A is currently: " + botA_dealdata)  
    }

    console.log("Enable flag status: " + enable)
    console.log("============================") 

    return enable
}

// The Bot Cascader Stop always work on two bots
// It returns an diable flag as it can't be set in the API from here
function botCascaderFinish(botA_dealdata, botB_dealdata)
{
  let disable = false
  let bot_no = 0

  if (botA_dealdata != "Not Assigned")
  {
      // Check the current profit is above breakeven
      console.log("Current price : " + botA_dealdata.current_price)
      console.log("Average price : " + botA_dealdata.bought_average_price)
      console.log("Bot B is currently: " + botB_dealdata.status)  
      if (botA_dealdata.current_price > botA_dealdata.bought_average_price)
      {
          console.log("Bot A Current Price is above breakeven")  
          // Is there a already deal running on bot2, if not start the bot 
          if (botB_dealdata.status == 'bought')
          {
              disable = true
          }
      }
  }
  else
  {
      console.log("Bot A is currently: " + botA_dealdata)  
  }

  console.log("Disable flag status: " + disable)
  console.log("============================") 

  return disable
}

initBotData()
mainLoop()
server.listen(5000) //3 - listen for any incoming requests