import complaintService from './complaint.service'

class contactController{
  async list(req,res){
    const data = await complaintService.list(req.query)
    res.json({...data})
  }

  async detail(req,res){
    const data = await complaintService.detail(req.params)
    res.json({...data})
  }

  async delete(req,res){
    const data = await complaintService.delete(req.params)
    res.json({...data})
  }
}

export default new contactController()