import paymentService from '../payment/payment.service'

class paymentController {
  async fetch(req, res) {
    const capture = await paymentService.fetch(req.body,req.user);
    res.status(200).json({ ...capture });
  }

}


export default new paymentController();