import exploreService from '../explore-collection/explore.service'

class exploreCollection {
  async add(req, res) {
    const data = await exploreService.add(req.body, req.file)
    res.json({ ...data })
  }


  async list(req, res) {
    const data = await exploreService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await exploreService.delete(req.params)
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await exploreService.detail(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await exploreService.edit(req.params, req.body, req.file)
    res.json({ ...data })
  }

}

export default new exploreCollection();