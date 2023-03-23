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
    let aquiredCoinT1 = 0;
    let aquiredCoinT2 = 0;
    let aquiredCoinT3 = 0;
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
            directionTrade1 = "quoteToBase";          
        }

        contract1 = pairA
        aquiredCoinT1 = startingAmount * swap1Rate

        //check if aQoute is in pairB
        if(direction === "forward"){
            if(aQuote=== bQuote && calculated ===0){
                swap2Rate = 1/bAsk
                aquiredCoinT2 = aquiredCoinT1 * swap2Rate
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
                aquiredCoinT3 = aquiredCoinT2 * swap3Rate
                calculated = 1
            }
            
        }




    }
}

module.exports ={
    getTriangularPairs,
    getPairPrices,
    getMarketPrices,
    calcSurfaceArb
}