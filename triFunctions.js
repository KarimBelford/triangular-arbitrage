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
const getCoinPairs = async() =>{
    let coinPairs = [];
    await client.getSymbols()
      .then(result => {

        let symbols = result.result.list;
        coinPairs = symbols.map(symbol => symbol.name);
      })
      .catch(err => {
        console.error("getOrderBook error: ", err);
      });
    return coinPairs;
}


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
    pairList = pairList.slice(0,10)
    const pairAList = [] 
    for(const pairsA of pairList){
        let aBase = pairsA[0]
        let aQuote = pairsA[1]
        pairAList.push([aBase,aQuote])
        let pairAbox = [aBase,aQuote]
 
        for(const pairsB of pairList){
                
            let bBase = pairsB[0]
            let bQuote = pairsB[1]

            if(pairsA !== pairsB){
                if(bBase === pairAbox[0] || bBase === pairAbox[1] || bQuote === pairAbox[0] || bQuote === pairAbox[1] ){
                    for(const pairsC of pairList){
                        let cBase = pairsC[0]
                        let cQuote = pairsC[1]
                        if(pairsC !== pairsA && pairsC !==pairsB){
                            const combineAll = [pairsA,pairsB,pairsC]
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
                                console.log(pairsA,pairsB,pairsC)
                            }
                        }
                    }
                }
            }
         }

    }    
};

getTriangularPairs()

module.exports ={
    getCoinPairs,
    getTriangularPairs
}