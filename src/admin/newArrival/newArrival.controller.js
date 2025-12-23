import newArrivalService from './newArrival.service'

class newArrivalController{
  async add(req,res){
    const data = await newArrivalService.add(req.body,req.file)
    res.json({...data})
  }

   async list(req, res) {
      const data = await newArrivalService.list()
      res.json({ ...data })
    }
  
    async delete(req, res) {
      const data = await newArrivalService.delete(req.params)
      res.json({ ...data })
    }
  
    async detail(req, res) {
      const data = await newArrivalService.detail(req.params)
      res.json({ ...data })
    }
  
    async edit(req, res) {
      const data = await newArrivalService.edit(req.params, req.body, req.file)
      res.json({ ...data })
    }
}

export default new newArrivalController()