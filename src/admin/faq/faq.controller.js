import knex from 'knex'
import faqService from '../faq/faq.service'

class faqController {
  async add(req, res) {
    const data = await faqService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await faqService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await faqService.delete(req.params)
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await faqService.detail(req.params)
    res.json({ ...data })
  }

  async edit(req,res){
    const data = await faqService.edit(req.params,req.body)
    res.json({...data})
  }
}

export default new faqController();