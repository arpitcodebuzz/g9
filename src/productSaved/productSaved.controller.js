import productService from './productSaved.service'

class productController {
  async add(req, res) {
    // console.log(req.user,'user')
    const data = await productService.add(req.user, req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    // console.log(req.query,'---')
    const data = await productService.list(req.user, req.query)
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await productService.delete(req.body, req.user);
    res.json({ ...data });
  }


  async movetoCart(req, res) {
    const data = await productService.movetoCart(req.user, req.body)
    res.json({ ...data })
  }

}

export default new productController()