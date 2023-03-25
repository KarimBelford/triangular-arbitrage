const {SpotClientV3} = require('bybit-api')
//api user info remember to hide later
const API_KEY = 'WMTy0NWg8tJinG1zy0';
const API_SECRET = 'U9S0ddY4cBqzuOCcBo7gcryJQpAp3dlD7Qhb';
const useTestnet = true;
//establish api connection
let client = new SpotClientV3({
    key: API_KEY,
    secret: API_SECRET,
    testnet: useTestnet,
    strict_param_validation: true,
    baseUrl:"https://api-testnet.bybit.com",
    },
)

//get pairs array 
const getMarketPrices = async() =>{
    let coinPairs = [];
    await client.getBestBidAskPrice()
      .then(result => {

        let symbols = result.result.list
        coinPairs = symbols
      })
      .catch(err => {
        console.error("getOrderBook error: ", err);
      });
    return coinPairs;
}








// get the base and qoute sympols and put them in an array 
const getBaseQuoteList = async() =>{
    let baseQuoteList = [];
    await client.getSymbols()
      .then(result => {
        let symbols = result.result.list;
        baseQuoteList = symbols.map(symbol => [symbol.baseCoin,symbol.quoteCoin]);
      })
      .catch(err => {
        console.error("getOrderBook error: ", err);
      });
    return baseQuoteList;
}

// get list of triangular pairs
const getTriangularPairs = async() => {
    let pairList = await getBaseQuoteList();
    let duplicates = {}
    let triangularPairsList = {}
   // pairList = pairList.slice(0,10)
    for(const pairsA of pairList){
        let aBase = pairsA[0]
        let aQuote = pairsA[1]
        let pairAsymbol = aBase+aQuote
        let pairAbox = [aBase,aQuote]
 
        for(const pairsB of pairList){
                
            let bBase = pairsB[0]
            let bQuote = pairsB[1]
            let pairBsymbol = bBase+bQuote

            if(pairsA !== pairsB){
                if(bBase === pairAbox[0] || bBase === pairAbox[1] || bQuote === pairAbox[0] || bQuote === pairAbox[1] ){
                    for(const pairsC of pairList){
                        let cBase = pairsC[0]
                        let cQuote = pairsC[1]
                        let pairCsymbol = cBase+cQuote
                        if(pairsC !== pairsA && pairsC !==pairsB){
                            const combineAll = [pairAsymbol,pairBsymbol,pairCsymbol]
                            const pairsBox = [aBase,aQuote,bBase,bQuote,cBase,cQuote]
                            let countcBase = 0
                            for(let i = 0; i<6;i++){
                                if(pairsBox[i]=== cBase){
                                    countcBase++
                                }
                            }

                            let countcQoute = 0
                            for(let i = 0; i<6;i++){
                                if(pairsBox[i]=== cQuote){
                                    countcQoute++
                                }
                            }

                            if(countcBase ===2 && countcQoute === 2 && cBase!== cQuote){
                                let uniqueItem = combineAll.sort().join('')
                                
                                if(duplicates[uniqueItem] === undefined){
                                    duplicates[uniqueItem] = uniqueItem
                                    
                                    let pairInfo = {
                                        "aBase": aBase,
                                        "aQuote": aQuote,
                                        "bBase": bBase,
                                        "bQuote": bQuote,
                                        "cBase": cBase,
                                        "cQuote": cQuote,
                                        "pairA": pairAsymbol,
                                        "pairB": pairBsymbol,
                                        "pairC": pairCsymbol,
                                    }
                                    triangularPairsList[uniqueItem] = pairInfo;
                                    
                                }
                                
                               
                            }
                        }
                    }
                }
            }
         }

    }
    return triangularPairsList 
};
//get prices for each pair in arbitrage
const getPairPrices = async(pair,priceData) => {
    let pairA = pair.pairA
    let pairB = pair.pairB
    let pairC = pair.pairC
    let pairAask, pairAbid, pairBask, pairBbid, pairCask, pairCbid;

    for(key in priceData){
        if(priceData[key].symbol===pairA){
            pairAask = priceData[key].askPrice
            pairAbid = priceData[key].bidPrice
        }
        if(priceData[key].symbol===pairB){
            pairBask = priceData[key].askPrice
            pairBbid = priceData[key].bidPrice 
        }
        if(priceData[key].symbol===pairC){
            pairCask = priceData[key].askPrice
            pairCbid = priceData[key].bidPrice 
        } 
            
    }
    
    if (pairAask === undefined || pairAask === '0' || pairAbid === undefined || pairAbid === '0' || pairBask === undefined || pairBask === '0' || pairBbid === undefined || pairBbid === '0' || pairCask === undefined || pairCask === '0' || pairCbid === undefined || pairCbid === '0') {
        return 0;
    } else {
        return {
            "pairAask": pairAask,
            "pairAbid": pairAbid,
            "pairBask": pairBask,
            "pairBbid": pairBbid,
            "pairCask": pairCask,
            "pairCbid": pairCbid,
        }
    }
}
//calculate surface arbitrage rate
const calcSurfaceArb = async(pair,priceDict) => {
    let startingAmount = 1;
    let minSurfaceRate = 0;
    let surfaceRateDict = {};
    let contract1;
    let contract2;
    let contract3;
    let directionTrade1 = "";
    let directionTrade2 = "";
    let directionTrade3 = "";
    let acquiredCoinT1 = 0;
    let acquiredCoinT2 = 0;
    let acquiredCoinT3 = 0;
    let calculated = 0;
    //pair info
    const aBase = pair.aBase;
    const aQuote = pair.aQuote;
    const bBase = pair.bBase;
    const bQuote = pair.bQuote;
    const cBase = pair.cBase;
    const cQuote = pair.cQuote;
    const pairA = pair.pairA;
    const pairB = pair.pairB;
    const pairC = pair.pairC;

    //price info
    const aAsk = priceDict.pairAask; 
    const aBid = priceDict.pairAbid;
    const bAsk = priceDict.pairBask; 
    const bBid = priceDict.pairBbid;
    const cAsk = priceDict.pairCask;
    const cBid = priceDict.pairCbid;

    /*Trade rules
        To go from base to qoute(left to right)
            swaprate = bid
        To go from qoute to base(right to left)
            swaprate = 1/ask        
     */
    let directionList = ["forward","reverse"];
    for(direction of directionList){
        let swap1;
        let swap2;
        let swap3;
        let swap1Rate;
        let swap2Rate;
        let swap3Rate;

        //starting with abase and swapping for aquote
        if(direction === "forward"){
            swap1 = aBase;
            swap2 = aQuote;
            swap1Rate = aBid
            directionTrade1 = "baseToQuote";
        }
        if(direction === "reverse"){
            swap1 = aQuote;
            swap2 = aBase;
            swap1Rate = 1/aAsk
            directionTrade1 = "QuoteToBase";
        }
        contract1 = pairA
        acquiredCoinT1 = startingAmount * swap1Rate

        
        if(direction === "forward"){
            //Scenario 1 check if aQoute === bQoute
            if(aQuote=== bQuote && calculated ===0){
                swap2Rate = 1/bAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairB

                if(bBase===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 2 check if aQoute === bBase
            }else if(aQuote === bBase && calculated ===0){
                swap2Rate = bBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairB

                if(bQuote===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 3 check if aQoute === cQoute
            }else if(aQuote=== cQuote && calculated ===0){
                swap2Rate = 1/cAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairC

                if(cBase===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }

                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 4 aQoute === cBase
            }else{
                swap2Rate = cBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairC

                if(cQuote===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            }
            
        }
        if(direction === "reverse"){
            //Scenario 1 check if aBase === bQoute
            if(aBase=== bQuote && calculated ===0){
                swap2Rate = 1/bAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairB

                if(bBase===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 2 check if aQoute === bBase
            }else if(aBase === bBase && calculated ===0){
                swap2Rate = bBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairB

                if(bQuote===cBase){
                    swap3 = cBase
                    swap3Rate = cBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairC
                }else{
                    swap3 = cQuote
                    swap3Rate = 1/cAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairC
                }
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 3 check if aQoute === cQoute
            }else if(aBase=== cQuote && calculated ===0){
                swap2Rate = 1/cAsk
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "quoteToBase"
                contract2 = pairC

                if(cBase===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }

                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            //Scenario 4 aQoute === cBase
            }else{
                swap2Rate = cBid
                acquiredCoinT2 = acquiredCoinT1 * swap2Rate
                directionTrade2 = "baseToQuote"
                contract2 = pairC

                if(cQuote===bBase){
                    swap3 = bBase
                    swap3Rate = bBid
                    directionTrade3 = "baseToQuote"
                    contract3 = pairB
                }else{
                    swap3 = bQuote
                    swap3Rate = 1/bAsk
                    directionTrade3 = "quoteToBase"
                    contract3 = pairB
                }
                acquiredCoinT3 = acquiredCoinT2 * swap3Rate
                calculated = 1
            }
           
            // console.log(direction,pairA,pairB,pairC,startingAmount,acquiredCoinT3)
            
        }
        //calculate profit

        let profitLoss = acquiredCoinT3 - startingAmount;
        let profitLossPercent = profitLoss!==0?(profitLoss/startingAmount)*100:0;    
        let trade1Details = `Start with ${startingAmount} ${swap1}. Swap at ${swap1Rate} for ${acquiredCoinT1} ${swap2}`
        let trade2Details = `Swap ${acquiredCoinT1} ${swap2} at ${swap2Rate} for ${acquiredCoinT2} ${swap3}`
        let trade3Details = `Swap ${acquiredCoinT2} ${swap3} at ${swap3Rate} for ${acquiredCoinT3} ${swap1}`
        
        if(profitLossPercent>minSurfaceRate){
            surfaceRateDict = {
                "swap1": swap1,
                "swap2": swap2,
                "swap3": swap3,
                "contract1": contract1,
                "contract2": contract2,
                "contract3": contract3,
                "directionTrade1": directionTrade1,
                "directionTrade2": directionTrade2,
                "directionTrade3": directionTrade3,
                "startingAmount": startingAmount,
                "acquiredCoinT1": acquiredCoinT1,
                "acquiredCoinT2": acquiredCoinT2,
                "acquiredCoinT3": acquiredCoinT3,
                "swap1Rate": swap1Rate,
                "swap2Rate": swap2Rate,
                "swap3Rate": swap3Rate,
                "profitLoss": profitLoss,
                "profitLossPercent": profitLossPercent,
                "direction": direction,
                "trade_description_1": trade1Details,
                "trade_description_2": trade2Details,
                "trade_description_3": trade3Details
            }

            return surfaceRateDict
        }
    }
    return 0

}

const getOrderBookData = async(surfaceArb) => {
    let {swap1,swap2,swap3,contract1,contract2,contract3,directionTrade1} = surfaceArb
    const {bidPriceDepth:bidPriceDepth1,askPriceDepth:askPriceDepth1} = await getOrderBookDepth(contract1)
    console.log(bidPriceDepth1)
    const priceUpdate1 = reformatData(askPriceDepth1,bidPriceDepth1,directionTrade1)
    console.log(priceUpdate1,directionTrade1)

}

const getOrderBookDepth = async(contract) => {
    const response = await client.getOrderBook(contract,20)
    const orderbookDepth = response.result;
    const {asks:askPriceDepth, bids:bidPriceDepth} = orderbookDepth;

    return {
        bidPriceDepth,
        askPriceDepth
    }

}

const reformatData = (askPriceData,bidPriceData,contractDirection) => {
    let priceList = []
    if(contractDirection === 'baseToQuote'){
        for(price of askPriceData){
            let askPrice = Number(price[0])
            let newPrice = askPrice != 0? 1/askPrice:0
            let newQuantity = Number(price[1])*askPrice
            priceList.push([newPrice,newQuantity])
        }
    } 
    if(contractDirection === 'quoteToBase'){
        for(price of bidPriceData){
            let bidPrice = Number(price[0])
            let newPrice = bidPrice != 0? bidPrice:0
            let newQuantity = Number(price[1])
            priceList.push([newPrice,newQuantity])
        }
    }
    return priceList

}

module.exports ={
    getTriangularPairs,
    getPairPrices,
    getMarketPrices,
    calcSurfaceArb,
    getOrderBookData
}