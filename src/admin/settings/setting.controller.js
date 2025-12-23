import settingService from '../settings/setting.service'

class settingController {
  async add(req, res) {
    const data = await settingService.add(req.body)
    res.json({ ...data })
  }

  async   list(req, res) {
    const data = await settingService.list()
    res.json({ ...data })
  }

  // async edit(req, res) {
  //   const data = await settingService.edit(req.params, req.body)
  //   res.json({ ...data })
  // }
}

export default new settingController()