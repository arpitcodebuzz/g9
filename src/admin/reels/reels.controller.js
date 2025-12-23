import reelService from '../reels/reels.service'

class reelController {
  async add(req, res) {
    const data = await reelService.add(req.file)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await reelService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await reelService.delete(req.params)
    res.json({ ...data })
  }
}

export default new reelController()