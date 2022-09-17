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
    apiKey: 'dfbe599fdc204734aba8d3d0af8f41584641eeee95f54d17b8ad2a7ea20aae34',
    apiSecret: 'cf709ce8bedfadba7c8e830988b6e8afcf9e7a0fc7e1decd10f759a6caeeb5200b010d2376768592cc3848bba5320dd33306c121bc4cfd1ca8f4da3a40bd18516475384a81ddc0a8863f47048bd6e49805d9390494ec22f7141976eb8d8102f4f8387dd0'
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

const BOT_CASCADE_START = 0
const BOT_CASCADE_FINISH = 1
const BOT_BASESAFETY_ORDER_UPDATE = 2
const BOT_DEALS_UPDATE = 3

const paperAccount = '31967815'
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

    switch (currentTask)
    {
        case BOT_CASCADE_START:

            console.log("=============================================================") 
            console.log("Group name: " + BotGroups[mainLoopIndex]._botGroupName)  
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

            currentTask = BOT_CASCADE_FINISH

            break;

        case BOT_CASCADE_FINISH:
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

            currentTask = BOT_BASESAFETY_ORDER_UPDATE

            break
        
        case BOT_BASESAFETY_ORDER_UPDATE:
        
            console.log("Update Base and safety Orders")
            console.log("====================") 
            // Check for completed deals and set new base order/safety order accordingly 
            
            // Reset deal data for not main bot group
            deal1 = NotAssigned
            deal2 = NotAssigned
            deal3 = NotAssigned
            deal4 = NotAssigned

            let currentbotParams = await api.botShow(BotGroups[mainLoopIndex]._bot1Id)
            console.log(currentbotParams)
            
            //await api.botUpdate({ bot_id: BotGroups[mainLoopIndex]._bot1Id, base_order_volume: 55 })
            

            // botOrderCompounder()
            var newBotParams = botOrderUpdater(currentbotParams, parseFloat(55), 151, BotGroups[mainLoopIndex]._bot1Id)
            //console.log("newBotParams: ")
            //console.log(newBotParams)

            const updateResult = await api.botUpdate(newBotParams)

            console.log("Update Result")
            console.log(updateResult)


            /*botOrderCompounder(deal1, BotGroups[mainLoopIndex]._bot1Id, Bot_1)
            botOrderCompounder(deal2, BotGroups[mainLoopIndex]._bot2Id, Bot_2)
            botOrderCompounder(deal3, BotGroups[mainLoopIndex]._bot3Id, Bot_3)
            botOrderCompounder(deal4, BotGroups[mainLoopIndex]._bot4Id, Bot_4)*/

            currentTask = BOT_DEALS_UPDATE
            break

        case BOT_DEALS_UPDATE:

            console.log("Update Bot deals")
            console.log("================") 
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
    
    if (botA_dealdata != NotAssigned)
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

  if (botA_dealdata != NotAssigned)
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

function botOrderCompounder(dealData, botId, botIndex)
{
    if (dealData != NotAssigned)
    {
        if (dealData.status == 'completed')
        {
            switch (botIndex)
            {
                case Bot_1:
                    BotGroups[mainLoopIndex]._dealId_Bot1 = NoDealFound
                    break;
                case Bot_2:
                    BotGroups[mainLoopIndex]._dealId_Bot2 = NoDealFound
                    break;                
                case Bot_3:
                    BotGroups[mainLoopIndex]._dealId_Bot3 = NoDealFound
                    break;                
                case Bot_4:
                    BotGroups[mainLoopIndex]._dealId_Bot4 = NoDealFound
                    break;
            }
            
            // Distribute Profit

            // Have to get the bot existing params first


            //await api.botUpdate({{: paperAccount, scope: 'active' }}})
            
        }
    }

}

function botOrderUpdater(currentbotParams, NewBaseOrder, NewSafetyOrder, botId)
{
    const NewBotParams = 
    {
        name: currentbotParams.name,
        pairs: currentbotParams.pairs,
        max_active_deals: currentbotParams.max_active_deals,
        base_order_volume: NewBaseOrder, // This is updated
        base_order_volume_type: currentbotParams.base_order_volume_type,
        take_profit: currentbotParams.take_profit,
        safety_order_volume: NewSafetyOrder, // This is updated
        safety_order_volume_type: currentbotParams.safety_order_volume_type,
        martingale_volume_coefficient: currentbotParams.martingale_volume_coefficient,
        martingale_step_coefficient: currentbotParams.martingale_step_coefficient,
        max_safety_orders: currentbotParams.max_safety_orders,
        active_safety_orders_count:	currentbotParams.active_safety_orders_count,
        stop_loss_percentage: currentbotParams.stop_loss_percentage,
        cooldown: currentbotParams.cooldown,
        trailing_enabled: currentbotParams.trailing_enabled,
        trailing_deviation:	currentbotParams.trailing_deviation,
        btc_price_limit: currentbotParams.btc_price_limit,
        safety_order_step_percentage: currentbotParams.safety_order_step_percentage,
        take_profit_type: currentbotParams.take_profit_type,
        strategy_list: [ { "strategy": "" } ],
        leverage_type: currentbotParams.leverage_type,
        leverage_custom_value: currentbotParams.leverage_custom_value,
        min_price: currentbotParams.min_price,
        max_price: currentbotParams.max_price,
        stop_loss_timeout_enabled: currentbotParams.stop_loss_timeout_enabled,
        stop_loss_timeout_in_seconds: currentbotParams.stop_loss_timeout_in_seconds,
        min_volume_btc_24h:	currentbotParams.min_volume_btc_24h,
        tsl_enabled: currentbotParams.tsl_enabled,
        deal_start_delay_seconds: currentbotParams.deal_start_delay_seconds,
        profit_currency: currentbotParams.profit_currency,
        start_order_type: currentbotParams.start_order_type,
        stop_loss_type:	currentbotParams.stop_loss_type,
        disable_after_deals_count: currentbotParams.disable_after_deals_count,
        allowed_deals_on_same_pair:	currentbotParams.allowed_deals_on_same_pair,
        close_deals_timeout: currentbotParams.close_deals_timeout,
        bot_id:	botId	// This is the changed bit from bot info 		
    }



/*    NewBotParams.name =	currentbotParams.name
    NewBotParams.pairs = currentbotParams.pairs
    NewBotParams.max_active_deals =	currentbotParams.max_active_deals
    NewBotParams.base_order_volume = NewBaseOrder // This is updated
    NewBotParams.base_order_volume_type	= currentbotParams.base_order_volume_type
    NewBotParams.take_profit = currentbotParams.take_profit
    NewBotParams.safety_order_volume = NewSafetyOrder // This is updated
    NewBotParams.safety_order_volume_type =	currentbotParams.safety_order_volume_type
    NewBotParams.martingale_volume_coefficient = currentbotParams.martingale_volume_coefficient
    NewBotParams.martingale_step_coefficient = currentbotParams.martingale_step_coefficient
    NewBotParams.max_safety_orders = currentbotParams.max_safety_orders
    NewBotParams.active_safety_orders_count	= currentbotParams.active_safety_orders_count
    NewBotParams.stop_loss_percentage =	currentbotParams.stop_loss_percentage
    NewBotParams.cooldown =	currentbotParams.cooldown
    NewBotParams.trailing_enabled =	currentbotParams.trailing_enabled
    NewBotParams.trailing_deviation	= currentbotParams.trailing_deviation
    NewBotParams.btc_price_limit = currentbotParams.btc_price_limit
    NewBotParams.safety_order_step_percentage =	currentbotParams.safety_order_step_percentage
    NewBotParams.take_profit_type =	currentbotParams.take_profit_type
    NewBotParams.strategy_list = currentbotParams.strategy_list
    NewBotParams.leverage_type = currentbotParams.leverage_type
    NewBotParams.leverage_custom_value = currentbotParams.leverage_custom_value
    NewBotParams.min_price = currentbotParams.min_price
    NewBotParams.max_price = currentbotParams.max_price
    NewBotParams.stop_loss_timeout_enabled = currentbotParams.stop_loss_timeout_enabled
    NewBotParams.stop_loss_timeout_in_seconds =	currentbotParams.stop_loss_timeout_in_seconds
    NewBotParams.min_volume_btc_24h	= currentbotParams.min_volume_btc_24h
    NewBotParams.tsl_enabled = currentbotParams.tsl_enabled
    NewBotParams.deal_start_delay_seconds =	currentbotParams.deal_start_delay_seconds
    NewBotParams.profit_currency = currentbotParams.profit_currency
    NewBotParams.start_order_type =	currentbotParams.start_order_type
    NewBotParams.stop_loss_type	= currentbotParams.stop_loss_type
    NewBotParams.disable_after_deals_count = currentbotParams.disable_after_deals_count
    NewBotParams.allowed_deals_on_same_pair	= currentbotParams.allowed_deals_on_same_pair
    NewBotParams.close_deals_timeout = currentbotParams.close_deals_timeout
    NewBotParams.bot_id	= botId	// This is the changed bit from bot info */

    return NewBotParams
}




initBotData()
mainLoop()
server.listen(5000) //3 - listen for any incoming requests