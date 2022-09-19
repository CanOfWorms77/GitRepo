const threeCommasAPI = require('3commas-api-node')

var http = require('http'); // 1 - Import Node.js core module
var fs = require('fs');


var server = http.createServer(function (req, res) 
{   
    res.write(BotGroups[mainLoopIndex].BOTGROUPNAME_INDEX + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex].BOT1_INDEX + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex].BOT2_INDEX + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex].BOT3_INDEX + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex].BOT4_INDEX + "\n"); //write a response to the client
    return res.end();
});

const MAX_NO_OF_BOTSPERGROUP = 4;

var BotGroups = [];

// Bot data table - "Bot Group name e.g. BTC", "DEVIATION_INDEX to start next bot e.g. -5", "Bot1Id", "Bot2Id" "Bot3Id" "Bot4Id",   
var BotDataTable = 
[
  ["CHZ" , -0.2,  '9739268', '9739271', '9739279', '9739288' ],
  ["LAST_ENTRY", null, null, null, null, null ],
] 

//console.log('Node.js web server at port 5000 is running..')

const api = new threeCommasAPI
({
    apiKey: 'dfbe599fdc204734aba8d3d0af8f41584641eeee95f54d17b8ad2a7ea20aae34',
    apiSecret: 'cf709ce8bedfadba7c8e830988b6e8afcf9e7a0fc7e1decd10f759a6caeeb5200b010d2376768592cc3848bba5320dd33306c121bc4cfd1ca8f4da3a40bd18516475384a81ddc0a8863f47048bd6e49805d9390494ec22f7141976eb8d8102f4f8387dd0'
})

var dealData = null

class botController
{
   constructor()
   {
      this._BOTGROUPNAME_INDEX = ""
      this._percentDEVIATION_INDEXToStart = 0
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
const BOTGROUPNAME_INDEX = 0
const DEVIATION_INDEX = 1
const BOTS_OFFSET_INDEX = 2
const BOT1_INDEX = 2
const BOT2_INDEX = 3
const BOT3_INDEX = 4
const BOT4_INDEX = 5
const DEALS_OFFSET_INDEX = 5
const DEAL1_INDEX = 6
const DEAL2_INDEX = 7
const DEAL3_INDEX = 8
const DEAL4_INDEX = 9


const BOT_CASCADE_START = 0
const BOT_CASCADE_FINISH = 1
const BOT_BASESAFETY_ORDER_UPDATE = 2
const BOT_DEALS_UPDATE = 3

const paperAccount = '32030096'
const realAccount = '29678480'

const NoDealFound = "No deal found"
const NotAssigned = "Not Assigned"

let deal1 = NotAssigned
let deal2 = NotAssigned
let deal3 = NotAssigned
let deal4 = NotAssigned

module.exports = botController;

let i = 0
let mainLoopIndex = 0
let currentTask = BOT_CASCADE_START
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
    let deal_id = NoDealFound
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

        BotGroups[bot_group_no]._BOTGROUPNAME_INDEX = BotDataTable[bot_group_no][BOTGROUPNAME_INDEX]
        BotGroups[bot_group_no]._percentDEVIATION_INDEXToStart = BotDataTable[bot_group_no][DEVIATION_INDEX]

        // Initialise data for Bot 1
        BotGroups[bot_group_no]._bot1Id = BotDataTable[bot_group_no][BOT1_INDEX];
        BotGroups[bot_group_no]._dealId_Bot1 = botIdDealMatcher(BotGroups[bot_group_no]._bot1Id, dealsData)

        // Initialise data for Bot 2
        BotGroups[bot_group_no]._bot2Id = BotDataTable[bot_group_no][BOT2_INDEX];
        BotGroups[bot_group_no]._dealId_Bot2 = botIdDealMatcher(BotGroups[bot_group_no]._bot2Id, dealsData)

        // Initialise data for Bot 3
        BotGroups[bot_group_no]._bot3Id = BotDataTable[bot_group_no][BOT3_INDEX];
        BotGroups[bot_group_no]._dealId_Bot3 = botIdDealMatcher(BotGroups[bot_group_no]._bot3Id, dealsData)

        // Initialise data for Bot 4
        BotGroups[bot_group_no]._bot4Id = BotDataTable[bot_group_no][BOT4_INDEX];
        BotGroups[bot_group_no]._dealId_Bot4 = botIdDealMatcher(BotGroups[bot_group_no]._bot4Id, dealsData)

        console.log(BotGroups[bot_group_no])                         
    }
}

const runBotEngine = async () =>
{
    // This runs every 2 seconds

    switch (currentTask)
    {
        case BOT_CASCADE_START:

            console.log("=============================================================") 
            console.log("Group name: " + BotGroups[mainLoopIndex]._BOTGROUPNAME_INDEX  )  
            console.log("=============================================================") 

            // Get Deals
            if (BotGroups[mainLoopIndex]._dealId_Bot1 != NoDealFound)
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

            if (BotGroups[mainLoopIndex]._dealId_Bot2 != NoDealFound)
            {
                deal2 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot2) 
            }
            
            if (BotGroups[mainLoopIndex]._dealId_Bot3 != NoDealFound)
            {
                deal3 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot3) 
            }

            if (BotGroups[mainLoopIndex]._dealId_Bot4 != NoDealFound)
            {
                deal4 = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot4) 
            }

            /*********************************************************************************************** */
            /* Cascade start logic                                                                           */
            /*********************************************************************************************** */
            let botEnableFlag = false

            // Check if Bot 2 should be started
            console.log("===========================") 
            console.log("Bot1 -> Bot2 Cascader Start")
            console.log("===========================") 
            botEnableFlag = botCascaderStart(deal1, deal2, BotGroups[mainLoopIndex]._percentDEVIATION_INDEXToStart)
            if (botEnableFlag == true)
            {
                await api.botEnable(BotGroups[mainLoopIndex]._bot2Id)
            }

            botEnableFlag = false

            // Check if Bot 3 should be started
            console.log("===========================") 
            console.log("Bot2 -> Bot3 Cascader Start")
            console.log("===========================") 
            botEnableFlag = botCascaderStart(deal2, deal3, BotGroups[mainLoopIndex]._percentDEVIATION_INDEXToStart)
            if (botEnableFlag == true)
            {
                await api.botEnable(BotGroups[mainLoopIndex]._bot3Id)
            }

            botEnableFlag = false

            // Check if Bot 4 should be started
            console.log("===========================") 
            console.log("Bot3 -> Bot4 Cascader Start")
            console.log("===========================") 
            botEnableFlag = botCascaderStart(deal3, deal4, BotGroups[mainLoopIndex]._percentDEVIATION_INDEXToStart)
            if (botEnableFlag == true)
            {
                await api.botEnable(BotGroups[mainLoopIndex]._bot4Id)
            }

            currentTask = BOT_CASCADE_FINISH
            break

        case BOT_CASCADE_FINISH:
            /*********************************************************************************************** */
            /* Cascade finish logic                                                                          */
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

            currentTask = BOT_BASESAFETY_ORDER_UPDATE
            break
        
        case BOT_BASESAFETY_ORDER_UPDATE:
        
            // Check for completed deals and set new base order/safety order accordingly 
            console.log("=============================") 
            console.log("Update Base and safety Orders")
            console.log("=============================") 

            let updateResult = null
            let currentBotParams = NotAssigned
            let newBotParams = NotAssigned
            // get the current bot params - This is used to update params
            currentBotParams = await api.botShow(BotGroups[mainLoopIndex]._bot1Id)
            newBotParams = botOrderCompounder(deal1, currentBotParams)
            console.log("bloody new bot: " + newBotParams.base_order_volume)
            if (newBotParams != NotAssigned)
            {
                const updateResult = await api.botUpdate(newBotParams)

                console.log("Update Result")
                console.log(updateResult)
            }

            currentBotParams = NotAssigned
            newBotParams = NotAssigned
            // get the current bot params - This is used to update params
            currentBotParams = await api.botShow(BotGroups[mainLoopIndex]._bot2Id)
            newBotParams = botOrderCompounder(deal2, currentBotParams)
            console.log("bloody new bot: " + newBotParams.base_order_volume)
            if (newBotParams != NotAssigned)
            {
                const updateResult = await api.botUpdate(newBotParams)

                console.log("Update Result")
                console.log(updateResult)
            }

            currentBotParams = NotAssigned
            newBotParams = NotAssigned
            // get the current bot params - This is used to update params
            currentBotParams = await api.botShow(BotGroups[mainLoopIndex]._bot3Id)
            newBotParams = botOrderCompounder(deal3, currentBotParams)
            console.log("bloody new bot: " + newBotParams.base_order_volume)
            if (newBotParams != NotAssigned)
            {
                const updateResult = await api.botUpdate(newBotParams)

                console.log("Update Result")
                console.log(updateResult)
            }

            currentBotParams = NotAssigned
            newBotParams = NotAssigned
            // get the current bot params - This is used to update params
            currentBotParams = await api.botShow(BotGroups[mainLoopIndex]._bot4Id)
            newBotParams = botOrderCompounder(deal4, currentBotParams)
            console.log("bloody new bot: " + newBotParams.base_order_volume)
            if (newBotParams != NotAssigned)
            {
                updateResult = await api.botUpdate(newBotParams)

                console.log("Update Result")
                console.log(updateResult)
            }

            currentTask = BOT_DEALS_UPDATE
            break

        case BOT_DEALS_UPDATE:

            console.log("Update Bot deals")
            console.log("================") 

            // Reset deal data for next main bot group index
            deal1 = NotAssigned
            deal2 = NotAssigned
            deal3 = NotAssigned
            deal4 = NotAssigned

            // Update new Deal Ids here
            // get latest active deal data for this account
            let NewdealsData = await api.getDeals({ account_id: paperAccount, scope: 'active' }) 

            console.log("NewDeals" + NewdealsData)

            // Update data for Bot 1
            BotGroups[mainLoopIndex]._dealId_Bot1 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot1Id, NewdealsData)

            // Update data for Bot 2
            BotGroups[mainLoopIndex]._dealId_Bot2 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot2Id, NewdealsData)

            // Update data for Bot 3
            BotGroups[mainLoopIndex]._dealId_Bot3 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot3Id, NewdealsData)

            // Update data for Bot 3
            BotGroups[mainLoopIndex]._dealId_Bot4 = botIdDealMatcher(BotGroups[mainLoopIndex]._bot4Id, NewdealsData)

            console.log(BotGroups[mainLoopIndex]) 

            currentTask = BOT_CASCADE_START
            break
        
        default:
            console.log("Shit - Shouldnt be here")     
            break
    }                      

    // Reset Loop Index  
    mainLoopIndex++
    if (BotDataTable[mainLoopIndex][0] == "LAST_ENTRY")
    {
        mainLoopIndex = 0;
    }

}

// The Bot Cascader start always work on two bots
// It returns an enable flag as it can't be set in the API from here
function botCascaderStart(botA_dealdata, botB_dealdata, botStartDEVIATION_INDEX)
{
    let enable = false
    let bot_no = 0
    
    if (botA_dealdata != NotAssigned)
    {
        console.log("Completed safety orders : " + botA_dealdata.completed_safety_orders_count)
        console.log("Max safety orders : " + botA_dealdata.max_safety_orders)  
        // Are all the safety orders filled
        if (botA_dealdata.completed_safety_orders_count == botA_dealdata.max_safety_orders)
        {
            console.log("Max safety orders reached - Start DEVIATION_INDEX" + botStartDEVIATION_INDEX)  
            if (botA_dealdata.actual_profit_percentage <= botStartDEVIATION_INDEX)
            {
                console.log("Actual profit : " + botA_dealdata.actual_profit_percentage)  
                // Is there a already deal running on bot2, if not start the bot
                if (botB_dealdata == NotAssigned)
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

    console.log("BotADeal:-" + botA_dealdata)
    if (botA_dealdata != NotAssigned)
    {
        // Check the current profit is above breakeven
        console.log("Current price : " + botA_dealdata.current_price)
        console.log("Average price : " + botA_dealdata.bought_average_price)
        console.log("Bot B is currently: " + botB_dealdata.status)  
        if (parseFloat(botA_dealdata.current_price) > parseFloat(botA_dealdata.bought_average_price))
        {
            console.log("BotBDeal:-" + botB_dealdata)
            console.log("Bot A Current Price is above breakeven")  
            // Is there a already deal running on bot2, if not start the bot 
            if (botB_dealdata.status == 'bought')
            {
                disable = true
                console.log("Bot B is disabled - " + disable)
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

function botOrderCompounder(dealData, botParams)
{
    var newBotParams = NotAssigned
    
    console.log("Deal data: " + dealData.status)
    if (dealData != NotAssigned)
    {
        console.log("Bot Params " + botParams.id)
        if ((botParams != undefined) && (botParams != NotAssigned))
        {
            if (dealData.status == 'completed')
            {             
                // Distribute Profit
                //let dealProfit = dealData
                console.log("Deal - Final Profit: " + dealData.usd_final_profit)
    
                // Get the percentages of the final profit. for now weight this to the current bot
    
                // Don't increment orders if the profit is negative for some reason
                if (dealData.usd_final_profit > 0)
                {
                    let baseOrderCompound = (dealData.usd_final_profit * 0.1) // 10%
                    let safetyOrderCompound = (dealData.usd_final_profit * 0.3) // 30%
                    
        
                    console.log("Base order compound value " + baseOrderCompound)
                    console.log("Safety order compound value " + safetyOrderCompound)
        
                    console.log("Current base order: " + botParams.base_order_volume)
                    console.log("Current safety order: " + botParams.safety_order_volume)
        
                    let newBaseOrder = parseFloat(botParams.base_order_volume) + parseFloat(baseOrderCompound)
                    let newSafetyOrder = parseFloat(botParams.safety_order_volume) + parseFloat(safetyOrderCompound)
        
                    console.log("New base order: " + newBaseOrder)
                    console.log("New safety order: " + newSafetyOrder)
    
                    const newBotParams = botOrderUpdate(botParams, 
                                                        parseFloat(newBaseOrder), 
                                                        parseFloat(newSafetyOrder), 
                                                        botParams.id)
                    
                    // Now that the current deal has been completed, reset the deal Id, ready to be updated
                    // with next deal
                    for (let x = 0; x < MAX_NO_OF_BOTSPERGROUP; x++)
                    {
                        if (BotDataTable[mainLoopIndex][x + BOTS_OFFSET_INDEX] == botParams.id)
                        {
                            BotDataTable[mainLoopIndex][x + DEALS_OFFSET_INDEX] = NoDealFound
                            console.log("Completed deal reset")
                        }
                    }
                }
            }
        }

    }

    return newBotParams
}

function botOrderUpdate(currentbotParams, NewBaseOrder, NewSafetyOrder, botId)
{
    const NewBotParams = 
    {
        name: currentbotParams.name,
        pairs: JSON.stringify([currentbotParams.pairs]),
        max_active_deals: currentbotParams.max_active_deals,
        base_order_volume: NewBaseOrder, // This is updated
        take_profit: currentbotParams.take_profit,
        safety_order_volume: NewSafetyOrder, // This is updated
        martingale_volume_coefficient: currentbotParams.martingale_volume_coefficient,
        martingale_step_coefficient: currentbotParams.martingale_step_coefficient,
        max_safety_orders: currentbotParams.max_safety_orders,
        active_safety_orders_count:	currentbotParams.active_safety_orders_count,
        safety_order_step_percentage: currentbotParams.safety_order_step_percentage,
        take_profit_type: currentbotParams.take_profit_type,
        strategy_list: JSON.stringify([{"strategy":"nonstop"}]), // currentbotParams.strategy_list,
        bot_id:	botId	// This is the changed bit from bot info 		
    }

    return NewBotParams
}

var http = require('http'); // 1 - Import Node.js core module
var fs = require('fs');


var server = http.createServer(function (req, res) 
{   
    res.write(BotGroups[mainLoopIndex]._BOTGROUPNAME_INDEX + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot1Id + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot2Id + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot3Id + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot4Id + "\n"); //write a response to the client
    return res.end();
});

initBotData()
mainLoop()
server.listen(5000) // - listen for any incoming requests