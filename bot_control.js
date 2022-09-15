const threeCommasAPI = require('3commas-api-node')

var http = require('http'); // 1 - Import Node.js core module

/*var server = http.createServer(function (req, res) 
{   // 2 - creating server

    //handle incomming requests here..

});*/

const MAX_NO_OF_BOTSPERGROUP = 4;

var BotGroups = [];

// Bot data table - "Bot Group name e.g. BTC", "deviation to start next bot e.g. -5", "Bot1Id", "Bot2Id" "Bot3Id" "Bot4Id",   
var BotDataTable = 
[
  ["LUNA", -0.1, "9711362", "9711367", "9711372", "9717010" ],
  ["LUNC", -0.1, "9711393", "9711399", "9711406", "9717006" ],
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
   }
}

// Would be enum in C - but can't be bothered with the node.js equivalent, so just hard code indexes
const BotGroupName = 0
const Deviation = 1
const Bot_1 = 2
const Bot_2 = 3
const Bot_3 = 4
const Bot_4 = 5

module.exports = botController;

let i = 0
let mainLoopIndex = 0
function mainLoop()
{
    setTimeout(() => 
    {
        runBotEngine()
        mainLoop();
    }, 2000) // 2 secs
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

// Account Id Paper 31967815
// Real Account Id 29678480

const initBotData = async () =>
{      
    // Declare variable to contain deal data
    let dealsData = await api.getDeals({ account_id: '31967815', scope: 'active' }) 

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
    // This runs every 2 seconds

    //let deal1 = await api.getDeals({ bot_id: BotGroups[mainLoopIndex]._bot1Id, scope: 'active' }) 
    let deal1 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot1) 
    let deal2 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot2) 
    //let deal3 = await api.getDeals({ bot_id: BotGroups[mainLoopIndex]._bot3Id, scope: 'active' }) 
    //let deal4 = await api.getDeals({ bot_id: BotGroups[mainLoopIndex]._bot4Id, scope: 'active' })

    console.log(deal1)
    console.log(BotGroups[mainLoopIndex]._dealId_Bot1)
    console.log(deal2)  

    let botEnableFlag = false

    botEnableFlag = botCascader(deal1, deal2, BotGroups[mainLoopIndex]._percentDeviationToStart)
    if (botEnableFlag == true)
    {
        await api.botEnable(BotGroups[mainLoopIndex]._bot2Id)
    }

    botEnableFlag = false


    console.log("botgroupno " + mainLoopIndex)  
    mainLoopIndex++
    if (BotDataTable[mainLoopIndex][0] == "LAST_ENTRY")
    {
        mainLoopIndex = 0;
    }

}

// The Bot Cascader always work on two bots
// It returns an enable flag as it can't be set in the API from here
function botCascader(botA_dealdata, botB_dealdata, botStartDeviation)
{
    let enable = false
    console.log(botA_dealdata.completed_safety_orders_count)

    // Are all the safety orders filled
    if (botA_dealdata.completed_safety_orders_count == botA_dealdata.max_safety_orders)
    {
        console.log("Have I got here?")  
        if (botA_dealdata.actual_profit_percentage <= botStartDeviation)
        {
            console.log("What about here?")  
            // Is there a already deal running on bot2
            if (botB_dealdata.id == undefined)
            {
                enable = true
                console.log("What about here?" + enable)  
            }
        }
    }

    return enable
}

function botEngine(botGroupNo)
{


  

  /* if (bot 1 orders filled)
    {
      if (bot 1 deal < ?? %)
      {
          if (bot 2 has no deal running)
          {
            enable bot 2
          }
      }

      // Cascade same logic as above with bot 2 and 3 and then 3 and 4


    } */

    /*
        // This is the logic for if deals have finished.
        if (bot 1 deal finished)
        {
            disable bot 2
            update base order of bot 1 by 1% or using the value that was made in profit, distribute onto each order.
        }
    */
}

const showDeals = async () => {
  let dealData = await api.getDeals
  ({
    limit: 20,
    scope: 'active',
  })
  console.log(dealData)
}


initBotData()
mainLoop()

//server.listen(5000) //3 - listen for any incoming requests
