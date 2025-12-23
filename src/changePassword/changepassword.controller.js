import knex from 'knex'
import changepasswordService from '../changePassword/changepassword.service'


class changepasswordClt{
  async changePassword(req,res){
      const data = await changepasswordService.changePassword(req.user,req.body)
      res.json({...data})
  }
}

export default new changepasswordClt()