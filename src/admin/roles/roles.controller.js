import rolesService from '../roles/roles.service'

class rolesController {
  async add(req, res) {
    const data = await rolesService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await rolesService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await rolesService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await rolesService.edit(req.body, req.params)
    res.json({ ...data })
  }

  async login(req, res) {
    const data = await rolesService.login(req.body)
    res.json({ ...data })
  }

  async updateStatus(req,res){
    const data = await rolesService.updateStatus(req.body)
    res.json({...data})
  }
}

export default new rolesController()