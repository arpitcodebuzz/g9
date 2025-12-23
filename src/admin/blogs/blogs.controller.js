import blogService from '../blogs/blogs.service'

class blogController{
  async add(req,res){
    const data = await blogService.add(req.body,req.file)
    res.json({...data})
  }

  async list(req,res){
    const data = await blogService.list()
    res.json({...data})
  }

  async detail(req,res){
    const data = await blogService.detail(req.params)
    res.json({...data})
  }

  async delete(req,res){
    const data = await blogService.delete(req.params)
    res.json({...data})
  }

  async edit(req,res){
    const data = await blogService.edit(req.params,req.body,req.file)
    res.json({...data})
  }
}

export default new blogController();