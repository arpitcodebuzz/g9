import productService from '../products/product.service'

class productController {
  async add(req, res) {
    // console.log(req.body)
    const data = await productService.add(req.body)
    res.json({ ...data })
  }

  async addMedia(req, res) {
    const data = await productService.addMedia(req.body, req.files)
    res.json({ ...data })
  }

  // async deleteImage(req, res) {
  //   const data = await productService.deleteImage(req.body)
  //   res.json({ ...data })
  // }

  async list(req, res) {
    const data = await productService.list(req.query)
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await productService.detail(req.params)
    res.json({ ...data })       
  }

  async delete(req, res) {
    const data = await productService.delete(req.params)
    res.json({ ...data })
  }

  async deleteMedia(req, res) {
    const data = await productService.deleteMedia(req.body);
    res.json({ ...data });
  }

  async edit(req, res) {
    const data = await productService.edit(req.params, req.body, req.files)
    res.json({ ...data })
  }

  async addtopSelling(req, res) {
    const data = await productService.addtopSelling(req.params)
    res.json({ ...data })
  }

  async removetopSelling(req, res) {
    const data = await productService.removetopSelling(req.params)
    res.json({ ...data })
  }

  async addCsv(req, res) {
    const uploadedFile = req.files?.file?.[0];
    const data = await productService.addCsv(uploadedFile);
    res.json({ ...data });
  }

  async goldPrice(req, res) {
    const data = await productService.goldPrice(req.query)
    res.json({ ...data })
  }
}

export default new productController()