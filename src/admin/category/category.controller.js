import categoryService from '../category/category.service'

class categoryController {
  async add(req, res) {
    const data = await categoryService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await categoryService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await categoryService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await categoryService.edit(req.body, req.params)
    res.json({ ...data })
  }

  async detail(req,res){
      const data = await categoryService.detail(req.params)
      res.json({...data})
  }

  async updateStatus(req,res){
    const data = await categoryService.updateStatus(req.params)
    res.json({...data})
  }
}

export default new categoryController()