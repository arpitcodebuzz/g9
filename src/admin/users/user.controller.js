import userService from '../users/user.service'

class userController{
  async list(req,res){
      const data = await userService.list(req.query)
      res.json({...data})
  }

  async detail(req,res){
    // console.log(req.params,'req.params')
    const data = await userService.detail(req.params)
    res.json({...data})
  }

  async delete(req,res){
    const data = await userService.delete(req.params)
    res.json({...data})
  }

  async updateStatus(req,res){
    const data = await userService.updateStatus(req.params)
    res.json({...data})
  }

  

}

export default new userController()