import askPriceService from './ask-price.service'

class askPriceController {
  async goldType(req, res) {
    const data = await askPriceService.goldType()
    res.json({ ...data })
  }
  async diamondType(req, res) {
    const data = await askPriceService.diamondType()
    res.json({ ...data })
  }
  async askPrice(req, res) {
    const data = await askPriceService.askPrice(req.body, req.file)
    res.json({ ...data })
  }
  async getAskprice(req, res) {
    if (!req.params.id) {
      return res.send({
        status: false,
        message: "Please provide id"
      })
    }
    const data = await askPriceService.getAskprice(req.params.id)
    res.json({ ...data })
  }
}

export default new askPriceController()