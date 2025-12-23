import authService from '../auth/auth.service'

class authController{
  async login(req,res){
    const data = await authService.login(req.body)
    res.json({...data})
  }

  async dashboard(req,res){
    const data = await authService.dashboard()
    res.json({...data})
  }
}

export default new authController;