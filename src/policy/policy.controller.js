import policyService from "../policy/policy.service";
import knex from '../common/config/database.config'

class faqController {

  async list(req, res) {
    const data = await policyService.list()
    res.json({ ...data })
  }
}

export default new faqController();