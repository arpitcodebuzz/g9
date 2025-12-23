import contactService from '../contact-us/contact.service'

class contactController{
  async list(req,res){
    const data = await contactService.list(req.query)
    res.json({...data})
  }

  async detail(req,res){
    const data = await contactService.detail(req.params)
    res.json({...data})
  }

  async delete(req,res){
    const data = await contactService.delete(req.params)
    res.json({...data})
  }
}

export default new contactController()