import blogsService from '../blogs/blogs.service'

class blogController {
  async list(req, res) {
    const data = await blogsService.list(req.query)
    res.json({ ...data })
  }

  async detail(req,res){
    const data = await blogsService.detail(req.params)
    res.json({...data})
  }
}

export default new blogController()