import authService from "../auth/auth.service";

class authController {
  async signUp(req, res) {
    const data = await authService.signUp(req.body)
    res.json({ ...data })
  }

  // async signUpWithGoogle(req, res) {
  //   const data = await authService.signUpWithGoogle(req.body)
  //   res.json({ ...data })
  // }

  async otpMethod(req,res){
    const data = await authService.otpMethod(req.body)
    res.json({...data})
  }
  
  async otpVerification(req, res) {
    const data = await authService.otpVerification(req.body)
    res.json({ ...data })
  }

  async userAddress(req, res) {
    const data = await authService.userAddress(req.user, req.body)
    res.json({ ...data })

  }

  async signIn(req, res) {
    const data = await authService.signIn(req.body)
    res.json({ ...data })
  }

  async signInOrSignUpWithGoogle(req, res) {
    const data = await authService.signInOrSignUpWithGoogle(req.body)
    res.json({ ...data })
  }

  async forgetPassword(req, res) {
    const data = await authService.forgetPassword(req.body)
    res.json({ ...data })
  }

  async changePassword(req, res) {
    const data = await authService.changePassword(req.user, req.body)
    res.json({ ...data })
  }

  async resendOtp(req, res) {
    const data = await authService.resendOtp(req.body)
    res.json({ ...data })
  }

  // async MobileOtpVerification(req, res) {
  //   const data = await authService.MobileOtpVerification(req.body)
  //   res.json({ ...data })
  // }

  async signOut(req, res) {
    const data = await authService.signOut(req.user)
    res.json({ ...data })
  }

}

export default new authController()