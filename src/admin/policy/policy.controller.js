import policyService from '../policy/policy.service'

class policyController{
  async add(req, res) {
      const data = await policyService.add(req.body)
      res.json({ ...data })
    }
  
    async list(req, res) {
      const data = await policyService.list()
      res.json({ ...data })
    }
  
    async delete(req, res) {
      const data = await policyService.delete(req.params)
      res.json({ ...data })
    }
  
    async edit(req, res) {
      const data = await policyService.edit(req.body, req.params)
      res.json({ ...data })
    }
  
    async detail(req,res){
        const data = await policyService.detail(req.params)
        res.json({...data})
    }

    
}

export default new policyController()