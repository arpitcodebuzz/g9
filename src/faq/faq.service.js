import knex from "../common/config/database.config";
import faqResources from "../admin/faq/resource/faq.resource";

class faqService {
  async list() {
    try {
      const data = await knex('faqs').orderBy('createdAt', 'desc')
      if(!data){
        return{
          status:true,
          message:'No data found !!'
        }
      }

      return {
        status: true,
        message: 'Faq list fetched successfully !!',
        data: data,
       
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



  async listpolicy() {
    try {
      const data = await knex('policy').select().orderBy('createdAt', 'desc')
      return {
        status: true,
        message: 'policy list fetched successfully !!',
        data: data
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'something went wrong !!'
      }
    }
  }

}

export default new faqService()