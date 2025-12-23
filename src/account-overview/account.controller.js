import accountService from '../account-overview/account.service'


class accountController {
  async list(req, res) {
    const data = await accountService.list(req.user)
    res.json({ ...data })
  }

  async edit(req, res) {
    // console.log("req.body -> ", req.body)
    // console.log("req.file -> ", req.file)
    // console.log("req.user -> ", req.user)
    const data = await accountService.edit(req.body, req.file, req.user)
    res.json({ ...data })
  }

  async userAddress(req, res) {
    const data = await accountService.userAddress(req.user)
    res.json({ ...data })
  }
}

export default new accountController()
