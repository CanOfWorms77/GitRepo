const threeCommasAPI = require('3commas-api-node')

const api = new threeCommasAPI({
  apiKey: '6d288e0f3f6540498c69cd7ba63358eb867603db3beb45329be096e00027ce98',
  apiSecret: '32b4969b4e012c117f51d20e1dfa531f60a7ba48e3fda1e012cb9f93325ec10ac47821befccd340c67a253ec06b31e2414517e2497f4258554e89c83a6552c75816dcf773fc7932d04f522c4ee423c7fd15eaab524887847f601fc865fa7376baf22d99f'
})

// get last 20 active deals
const showActiveDeals = async () => {
  let data = await api.getDeals({
    limit: 20,
    scope: 'active',
  })
  console.log(data)
}

showActiveDeals()

