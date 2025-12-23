import mediaService from './media.service'

class mediaController {
  async add(req, res) {
    const data = await mediaService.add(req.body, req.file)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await mediaService.list()
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await mediaService.detail(req.params)
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await mediaService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    console.log("🚀 ~ mediaController ~ edit ~ req.file:", req.file)
    const data = await mediaService.edit(req.params, req.body, req.file)
    res.json({ ...data })
  }
}

export default new mediaController();