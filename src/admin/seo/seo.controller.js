import seoService from '../seo/seo.service'

class seoController {
  async add(req, res) {
    const data = await seoService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await seoService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await seoService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await seoService.edit(req.body, req.params)
    res.json({ ...data })
  }

  async detail(req,res){
    const data = await seoService.detail(req.params)
    res.json({...data})
  }
}

export default new seoController()