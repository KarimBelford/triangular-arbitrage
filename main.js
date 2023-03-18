const {SpotClientV3} = require('bybit-api')

const API_KEY = 'WMTy0NWg8tJinG1zy0';
const API_SECRET = 'U9S0ddY4cBqzuOCcBo7gcryJQpAp3dlD7Qhb';
const useTestnet = true;

let client = new SpotClientV3({
    key: API_KEY,
    secret: API_SECRET,
    testnet: useTestnet,
    strict_param_validation: true,
    baseUrl:"https://api-testnet.bybit.com",
    },
)


client.getOrderBook('BTCUSDT')
  .then(result => {
    console.log("getOrderBook result: ", result.result.asks);
  })
  .catch(err => {
    console.error("getOrderBook error: ", err);
  });