import wishlistService from '../wishlist/wishlist.service'

class wishlistController {
  async add(req, res) {
    const data = await wishlistService.add(req.user, req.body);
    res.json(data);
  }

  async list(req, res) {
    // console.log(req.query,'---')
    const data = await wishlistService.list(req.user, req.query)
    res.json({ ...data })
  }

  async delete(req, res) {
    // All data comes from request body now

    const data = await wishlistService.delete(req.body, req.user);
    return res.json({ ...data });
  }


}

export default new wishlistController()