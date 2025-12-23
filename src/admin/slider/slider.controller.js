
import sliderService from '../slider/slider.service'

class sliderController{
  async add(req,res){
    const data = await sliderService.add(req.body,req.file)
    res.json({...data})
  }

  async list(req,res){
    const data = await sliderService.list()
    res.json({...data})
  }

  async delete(req,res){
    const data = await sliderService.delete(req.params)
    res.json({...data})
  }
}

export default new sliderController()