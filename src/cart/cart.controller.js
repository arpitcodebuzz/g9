import cartService from '../cart/cart.service'

class cartController {
  async add(req, res) {
    const data = await cartService.add(req.user, req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await cartService.list(req.user,req.query)
    res.json({ ...data })
  }

  async delete(req, res) {
  // Get product variant details from request body
  const { productId, purityValue, metalId } = req.body;

  // Pass to service along with authenticated user
  const data = await cartService.delete({ productId, purityValue, metalId }, req.user);

  res.json(data);
}


  async cartQty(req,res){
    const data = await cartService.cartQty(req.user,req.body)
    res.json({...data})
  }


  async orderSummary(req,res){
    const {productId} = req.params;
    const data = await cartService.orderSummary(productId,req.user,req.query)
    res.json({...data})
  }


}

export default new cartController()