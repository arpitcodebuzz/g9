import metalsService from '../metals/metals.service'

class metalsController {
  async add(req, res) {
    const data = await metalsService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await metalsService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await metalsService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await metalsService.edit(req.body, req.params)
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await metalsService.detail(req.params)
    res.json({ ...data })
  }
}

export default new metalsController();