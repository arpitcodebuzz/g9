import productService from '../products/products.service'
import knex from '../common/config/database.config'

class productController {
  async Categorylist(req, res) {
    const data = await productService.Categorylist()
    res.json({ ...data })
  }

  async subCategoryList(req, res) {
    const data = await productService.subCategoryList(req.query)
    res.json({ ...data })
  }

  async productList(req, res) {
    const data = await productService.productList(req.query)
    res.json({ ...data })
  }

  async topSelling(req, res) {
    const data = await productService.topSelling(req.query)
    res.json({ ...data })
  }

  async metalsList(req, res) {
    const data = await productService.metalsList()
    res.json({ ...data })
  }

  async getStoneShape(req, res) {
    const data = await productService.getStoneShape()
    res.json({ ...data })
  }

  async getgoldPurity(req, res) {
    const data = await productService.getgoldPurity()
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await productService.detail(req.params, req.query)
    res.json({ ...data })
  }

  async priceFilter(req, res) {
    const data = await productService.priceFilter(req.query)
    res.json({ ...data })
  }
}

export default new productController()