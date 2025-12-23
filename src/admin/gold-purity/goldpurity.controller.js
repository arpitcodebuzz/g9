import goldPurityService from '../gold-purity/goldpurity.service'

class categoryController {
  async add(req, res) {
    const data = await goldPurityService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await goldPurityService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await goldPurityService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await goldPurityService.edit(req.body, req.params)
    res.json({ ...data })
  }

  async detail(req,res){
      const data = await goldPurityService.detail(req.params)
      res.json({...data})
  }
}

export default new categoryController()