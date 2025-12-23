
import festivalService from '../festival/festival.service'

class festivalController{
  async add(req,res){
    const data = await festivalService.add(req.file)
    res.json({...data})
  }

  async list(req,res){
    const data = await festivalService.list()
    res.json({...data})
  }

  async delete(req,res){
    const data = await festivalService.delete(req.params)
    res.json({...data})
  }
}

export default new festivalController()