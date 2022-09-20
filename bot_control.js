const threeCommasAPI = require('3commas-api-node')

var http = require('http'); // 1 - Import Node.js core module
var fs = require('fs');

const fileconsole = new console.Console(fs.createWriteStream('./output.txt'))
const fileprofitconsole = new console.Console(fs.createWriteStream('./output1.txt'))


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
  ["CHZ" , -0.25,  '9739268', '9739271', '9739279', '9739288' ],
  ["APE" , -3.0,  '9744505', '9744511', '9744516', '9744520' ],
  ["SOL" , -5.0,  '9744853', '9744846', '9744854', '9744856' ],
  ["LAST_ENTRY", null, null, null, null, null ],
] 

//fileconsole.log('Node.js web server at port 5000 is running..')

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
      this._botGroupName = ""
      this._percentDeviationIndexToStart = 0
      this._botId = [ 0, 0, 0, 0 ]
      this._botEnabled = [ false, false, false, false ]
      this._dealId_Bot = [ 0, 0, 0, 0 ]
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

const BOT_DATA_UPDATE = 0
const BOT_CASCADE_START = 1
const BOT_CASCADE_FINISH = 2
const BOT_BASESAFETY_ORDER_UPDATE = 3
const BOT_DEALS_UPDATE = 4

const paperAccount = '32030096'
const realAccount = '29678480'

const NoDealFound = "No deal found"
const NotAssigned = "Not Assigned"

var dealDataForProcessing = [ NotAssigned, NotAssigned, NotAssigned, NotAssigned ]

module.exports = botController

let i = 0
let mainLoopIndex = 0
let currentTask = BOT_DATA_UPDATE
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
    
    fileconsole.log("Initial Setup")  

    // Create bot control instances
    for (let bot_group_no = 0; BotDataTable[bot_group_no][0] != "LAST_ENTRY"; bot_group_no++)
    {
        // Declare objects of bot controller class
        BotGroups[bot_group_no] = new botController()

        BotGroups[bot_group_no]._botGroupName = BotDataTable[bot_group_no][BOTGROUPNAME_INDEX]
        BotGroups[bot_group_no]._percentDeviationIndexToStart = BotDataTable[bot_group_no][DEVIATION_INDEX]

        for (let bot_index = 0; bot_index < MAX_NO_OF_BOTSPERGROUP; bot_index++)
        {
            BotGroups[bot_group_no]._botId[bot_index] = BotDataTable[bot_group_no][BOTS_OFFSET_INDEX + bot_index];
            //fileconsole.log(" bot index: " + BotGroups[bot_group_no]._botId[bot_index])
            BotGroups[bot_group_no]._dealId_Bot[bot_index] = botIdDealMatcher(BotGroups[bot_group_no]._botId[bot_index], dealsData)
        }

        fileconsole.log(BotGroups[bot_group_no])                         
    }
}

const runBotEngine = async () =>
{
    // This runs every 2 seconds

    switch (currentTask)
    {
        case BOT_DATA_UPDATE:

            let botInfo = NotAssigned
            for (let bot_index = 0; bot_index < MAX_NO_OF_BOTSPERGROUP; bot_index++)
            {
                botInfo = await api.botShow(BotGroups[mainLoopIndex]._botId[bot_index])
                BotGroups[mainLoopIndex]._botEnabled[bot_index] = botInfo.is_enabled   
            }
            
            console.log("MainLoopIndex: " + mainLoopIndex)
            console.log(BotGroups[mainLoopIndex])   

            currentTask = BOT_CASCADE_START
            break

        case BOT_CASCADE_START:
      
            fileconsole.log("=============================================================") 
            fileconsole.log("Group name: " + BotGroups[mainLoopIndex]._botGroupName)  
            fileconsole.log("=============================================================") 

            // Get Deals
            let botEnableFlag = false
            for (let bot_index = 0; bot_index < MAX_NO_OF_BOTSPERGROUP; bot_index++)
            {
                if (BotGroups[mainLoopIndex]._dealId_Bot[bot_index] != NoDealFound)
                {
                    dealDataForProcessing[bot_index] = await api.getDeal(BotGroups[mainLoopIndex]._dealId_Bot[bot_index]) 
                }
                else
                {
                    if (bot_index == 0)
                    {
                        // Bot 1 should always have deal for the cascading to work
                        // so it could be that the bot is off, so enable here
                        await api.botEnable(BotGroups[mainLoopIndex]._botId[bot_index])
                        fileconsole.log("Enabling Bot :" + (bot_index + 1))
                    }

                }

                /*********************************************************************************************** */
                /* Cascade start logic                                                                           */
                /*********************************************************************************************** */

                // Check if Bots should be started
//                fileconsole.log("==========================================================") 
//                fileconsole.log("Bot" + bot_index + " -> Bot" + (bot_index + 1) + "Cascader Start")
//                fileconsole.log("==========================================================")
                
                // This if statement prevents the last bot from being included as the primary bot in the cascader start
                if (bot_index < (MAX_NO_OF_BOTSPERGROUP - 1))
                {
                    botEnableFlag = botCascaderStart(BotGroups[mainLoopIndex]._percentDeviationIndexToStart, bot_index)
                    
                    if (botEnableFlag == true)
                    {
                        // bot index + 1 as its always enabling the second bot of the pair
                        await api.botEnable(BotGroups[mainLoopIndex]._botId[bot_index + 1])
                    }

                    botEnableFlag = false
                }
            }

            currentTask = BOT_CASCADE_FINISH
            break

        case BOT_CASCADE_FINISH:
            /*********************************************************************************************** */
            /* Cascade finish logic                                                                          */
            /*********************************************************************************************** */

            let botDisableFlag = false

            for (let bot_index = 0; bot_index < MAX_NO_OF_BOTSPERGROUP; bot_index++)
            {
 
//                fileconsole.log("==========================================================") 
//                fileconsole.log("Bot" + bot_index + " -> Bot" + (bot_index + 1) + "Cascader Finish")
//                fileconsole.log("==========================================================")

                // This if statement prevents the last bot from being included as the primary bot in the cascader finish
                if (bot_index < (MAX_NO_OF_BOTSPERGROUP - 1))
                {
                    botDisableFlag = botCascaderFinish(bot_index)

                    if (botDisableFlag == true)
                    {
                        // bot index + 1 as its always disabling the second bot of the pair
                        await api.botDisable(BotGroups[mainLoopIndex]._botId[bot_index + 1])
                    }
                }
    
                botDisableFlag = false
            }

            currentTask = BOT_BASESAFETY_ORDER_UPDATE
            break
        
        case BOT_BASESAFETY_ORDER_UPDATE:
        
            // Check for completed deals and set new base order/safety order accordingly 
//            fileconsole.log("=============================") 
//            fileconsole.log("Update Base and safety Orders")
//            fileconsole.log("=============================") 

            let updateResult = null
            let currentBotParams = NotAssigned
            let newBotParams = NotAssigned

            for (let bot_index = 0; bot_index < MAX_NO_OF_BOTSPERGROUP; bot_index++)
            {                
                // get the current bot params - This is used to update params
                currentBotParams = await api.botShow(BotGroups[mainLoopIndex]._botId[bot_index])
                fileconsole.log("CurrentBotParams Id for Bot " + (bot_index + 1) + currentBotParams.id)
                if (currentBotParams != NotAssigned)
                {
                    // Use this data to update bot status record
                    BotGroups[mainLoopIndex]._botEnabled[bot_index] = currentBotParams.is_enabled
                    
                    fileconsole.log("Bot: " + (bot_index + 1) + " Bot enable is: " + BotGroups[mainLoopIndex]._botEnabled[bot_index])
                    newBotParams = botOrderCompounder(dealDataForProcessing[bot_index], currentBotParams)
                    //fileprofitconsole.log("Got here 2" + newBotParams.base_order_volume)
                    if (newBotParams != NotAssigned)
                    {
                        //fileprofitconsole.log("bloody new bot: " + newBotParams)
                        const updateResult = await api.botUpdate(newBotParams)
    
                        let debuginfo = await api.botShow(BotGroups[mainLoopIndex]._botId[bot_index])
    
                        fileconsole.log("NewBaseOrder debug: " + debuginfo.base_order_volume)
                    }
                }

                currentBotParams = NotAssigned
                newBotParams = NotAssigned
            }

            currentTask = BOT_DEALS_UPDATE
            break

        case BOT_DEALS_UPDATE:

            //fileconsole.log("Update Bot deals")
            //fileconsole.log("================") 

            // Reset deal data for next main bot group index
            dealDataForProcessing = [ NotAssigned, NotAssigned, NotAssigned, NotAssigned ]

            // Update new Deal Ids here
            // get latest active deal data for this account
            let NewdealsData = await api.getDeals({ account_id: paperAccount, scope: 'active' }) 

            //fileconsole.log("NewDeals" + NewdealsData)

            for (let bot_index = 0; bot_index < MAX_NO_OF_BOTSPERGROUP; bot_index++)
            {
                if (BotGroups[mainLoopIndex]._dealId_Bot[bot_index] == NoDealFound)
                {
                    BotGroups[mainLoopIndex]._dealId_Bot[bot_index] = botIdDealMatcher(BotGroups[mainLoopIndex]._botId[bot_index], 
                                                                                       NewdealsData)

                    if (BotGroups[mainLoopIndex]._dealId_Bot[bot_index] != NoDealFound)
                    {
                        fileconsole.log("DealUpdated: " + BotGroups[mainLoopIndex]._dealId_Bot[bot_index]) 
                    }                                                                
                }
            }

            currentTask = BOT_DATA_UPDATE
            break
        
        default:
            fileconsole.log("Shit - Shouldnt be here")     
            break
    }                      

    // Reset Loop Index
    console.log("Running: " + mainLoopIndex)
    console.log("Task: " + currentTask)
    if (currentTask == BOT_DATA_UPDATE)
    {
        mainLoopIndex++
    }
    if (BotDataTable[mainLoopIndex][0] == "LAST_ENTRY")
    {
        mainLoopIndex = 0;
    }

}

// The Bot Cascader start always work on two bots
// It returns an enable flag as it can't be set in the API from here
function botCascaderStart(botStartDeviationIndex, bot_index)
{
    let enable = false
    
    if (dealDataForProcessing[bot_index] != NotAssigned)
    {
        //fileconsole.log("Completed safety orders : " + botA_dealdata.completed_safety_orders_count)
        //fileconsole.log("Max safety orders : " + botA_dealdata.max_safety_orders)  
        // Are all the safety orders filled
        if (dealDataForProcessing[bot_index].completed_safety_orders_count == dealDataForProcessing[bot_index].max_safety_orders)
        {
            //fileconsole.log("Max safety orders reached - Start DEVIATION_INDEX" + botStartDeviationIndex)  
            if (dealDataForProcessing[bot_index].actual_profit_percentage <= botStartDeviationIndex)
            {
                //fileconsole.log("Actual profit : " + botA_dealdata.actual_profit_percentage)  
                // Is there a already deal running on bot2, if not start the bot
                if (dealDataForProcessing[bot_index + 1] == NotAssigned)
                {
                    enable = true
                    // bot index + 2 is to away start form 0 and wanting the second bot of the pair being compared
                    fileconsole.log("Bot " + (bot_index + 2) + " is enabling: " + enable)
                }
            }
        }
    }
    else
    {
        //fileconsole.log("Bot A is currently: " + botA_dealdata)  
    }

    //fileconsole.log("Enable flag status: " + enable)
    //fileconsole.log("============================") 

    return enable
}

// The Bot Cascader Stop always work on two bots
// It returns an diable flag as it can't be set in the API from here
function botCascaderFinish(bot_index)
{
    let disable = false

    //fileconsole.log("BotADeal:-" + botA_dealdata)
    if (dealDataForProcessing[bot_index] != NotAssigned)
    {
        // Check the current profit is above breakeven
        //fileconsole.log("Current price : " + botA_dealdata.current_price)
        //fileconsole.log("Average price : " + botA_dealdata.bought_average_price)
        //fileconsole.log("Bot B is currently: " + botB_dealdata.status)  
        if (parseFloat(dealDataForProcessing[bot_index].current_price) > 
            parseFloat(dealDataForProcessing[bot_index].bought_average_price))
        {
            fileconsole.log("Bot " + (bot_index + 2) + " Deal Id: " + dealDataForProcessing[bot_index].id)
            fileconsole.log("Bot " + (bot_index + 2) + " Current Price is above breakeven")  
            // Is there a already deal running on bot2, if not start the bot 
            if (dealDataForProcessing[bot_index + 1].status == 'bought')
            {
                disable = true
                fileconsole.log("Bot " + (bot_index + 2) + " is disabling: " + disable)
            }
        }
    }
    else
    {
        //fileconsole.log("Bot A is currently: " + botA_dealdata)  
    }

    return disable
}

function botOrderCompounder(dealData, botParams)
{
    var newBotParams = NotAssigned
    
    if (dealData != NotAssigned)
    {
        //fileconsole.log("Deal data: " + dealData.status)
        //fileconsole.log("Bot Params " + botParams.id)
        if ((botParams != undefined) && (botParams != NotAssigned))
        {
            //fileprofitconsole.log("Got here:- " + dealData.status)
            fileconsole.log("OrderCompounder: " +  dealData.id)
            fileconsole.log("Deal data: " + dealData.status)
            if (dealData.status == 'completed')
            {             
                // Distribute Profit
                fileconsole.log("Deal - Final Profit: " + dealData.usd_final_profit)
    
                // Get the percentages of the final profit. for now weight this to the current bot
    
                // Don't increment orders if the profit is negative for some reason
                if (dealData.usd_final_profit > 0)
                {
                    let baseOrderCompound = (dealData.usd_final_profit * 0.1) // 10%
                    let safetyOrderCompound = (dealData.usd_final_profit * 0.3) // 30%
                    
        
                    fileconsole.log("Base order compound value " + baseOrderCompound)
                    fileconsole.log("Safety order compound value " + safetyOrderCompound)
        
                    fileconsole.log("Current base order: " + botParams.base_order_volume)
                    fileconsole.log("Current safety order: " + botParams.safety_order_volume)
        
                    let newBaseOrder = parseFloat(botParams.base_order_volume) + parseFloat(baseOrderCompound)
                    let newSafetyOrder = parseFloat(botParams.safety_order_volume) + parseFloat(safetyOrderCompound)
        
                    fileconsole.log("New base order: " + newBaseOrder)
                    fileconsole.log("New safety order: " + newSafetyOrder)
    
                    newBotParams = botOrderUpdate(botParams, 
                                                  parseFloat(newBaseOrder), 
                                                  parseFloat(newSafetyOrder), 
                                                  botParams.id)

                    //fileprofitconsole.log("WTF..." + newBotParams)
                    //fileprofitconsole.log("WTF..." + newBotParams.base_order_volume)
          
                    // Now that the current deal has been completed, reset the deal Id, ready to be updated
                    // with next deal
                    for (let x = 0; x < MAX_NO_OF_BOTSPERGROUP; x++)
                    {
                        if (BotDataTable[mainLoopIndex][x + BOTS_OFFSET_INDEX] == botParams.id)
                        {
                            BotDataTable[mainLoopIndex][x + DEALS_OFFSET_INDEX] = NoDealFound
                            fileconsole.log("Completed deal reset")
                        }
                    }
                }
            }
        }

    }

    //fileconsole.log("WTF...id" + newBotParams.bot_id)
    //fileprofitconsole.log("WTF...base" + newBotParams.base_order_volume)
    //fileconsole.log("WTF..." + newBotParams)
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
    res.write(BotGroups[mainLoopIndex]._botGroupName + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot1Id + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot2Id + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot3Id + "\n"); //write a response to the client
    res.write(BotGroups[mainLoopIndex]._bot4Id + "\n"); //write a response to the client
    return res.end();
});

initBotData()
mainLoop()
server.listen(5000) // - listen for any incoming requests