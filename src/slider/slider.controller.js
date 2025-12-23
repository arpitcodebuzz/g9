import sliderService from '../slider/slider.service'
import knex from '../common/config/database.config';

class sliderController {
  async list(req, res) {
    const data = await sliderService.list()
    res.json({ ...data })
  }
}

export default new sliderController();