import faqService from "../faq/faq.service";

class faqController{
  async list(req,res){
    const data = await faqService.list()
    res.json({...data})
  }

    async listpolicy(req, res) {
        const data = await faqService.listpolicy()
        res.json({ ...data })
      }
}

export default new faqController();