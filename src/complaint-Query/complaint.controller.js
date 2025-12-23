import complaintService from '../complaint-Query/complaint.service'


class complaintController{
  async add(req,res){
      const data = await complaintService.add(req.user,req.body,req.files)
      res.json(data)
  }
}


export default new complaintController()