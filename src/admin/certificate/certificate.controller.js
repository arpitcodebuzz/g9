
import certificteService from '../certificate/certificate.service'

class certificateController {
  async add(req, res) {
    const data = await certificteService.add(req.body, req.files)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await certificteService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await certificteService.delete(req.params)
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await certificteService.detail(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await certificteService.edit(req.params, req.body, req.files)
    res.json({ ...data })
  }


}

export default new certificateController()
