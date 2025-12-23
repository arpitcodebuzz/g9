import contactService from '../contact-us/contact.service'

class contactController{
    async add(req,res){
      const data = await contactService.add(req.body,req.files,req.user)
      res.json({...data})
    }

   
}

export default new contactController()