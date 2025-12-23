import knex from "../common/config/database.config";

class policyService {

  async list() {
    try {
      const data = await knex('policy').orderBy('createdAt','desc')
      if(!data){
        return{
          status:false,
          message:'No data found !!'
        }
      }

      return{
        status:true,
        message:'Policy list fetched successfully !!',
        data:data
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }

  }

}

export default new policyService()