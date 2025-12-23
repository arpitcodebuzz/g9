import addressService from '../manage-address/address.service'

class addressController{
  async list(req,res){
    const data = await addressService.list(req.user)
    res.json({...data}) 
  }

  async setPrimary(req,res){
    const data = await addressService.setPrimary(req.params)
    res.json({...data})
  }

  async delete(req,res){
    const data = await addressService.delete(req.params)
    res.json({...data})
  }

  async edit(req,res){
    const data = await addressService.edit(req.params,req.body)
    res.json({...data})
  }

}

export default new addressController()