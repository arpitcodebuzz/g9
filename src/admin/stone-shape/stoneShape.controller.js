import stoneShapeService from '../stone-shape/stoneShape.service'

class categoryController {
  async add(req, res) {
    const data = await stoneShapeService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await stoneShapeService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await stoneShapeService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await stoneShapeService.edit(req.body, req.params)
    res.json({ ...data })
  }

  async detail(req,res){
      const data = await stoneShapeService.detail(req.params)
      res.json({...data})
  }
}

export default new categoryController()