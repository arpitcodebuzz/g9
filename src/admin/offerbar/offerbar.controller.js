import offerbarservice from './offerbar.service'

class metalsController {
  async add(req, res) {
    const data = await offerbarservice.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await offerbarservice.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await offerbarservice.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await offerbarservice.edit(req.body, req.params)
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await offerbarservice.detail(req.params)
    res.json({ ...data })
  }
}

export default new metalsController();