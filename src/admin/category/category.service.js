import knex from '../../common/config/database.config'

class categoryService {
  async add(body) {
    try {
      const { name } = body
      await knex('category').insert({
        name
      })

      return {
        status: true,
        message: 'Category added successfully !!'
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

  async list() {
    try {
      const data = await knex('category').select().orderBy('createdAt', 'desc')
      return {
        status: true,
        message: 'Category list fetched successfully !!',
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

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('category').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('category').where({ id }).del()

      return {
        status: true,
        message: 'Category deleted successfully !!'
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

  async edit(body,params) {
    try {
      const { id } = params
      const { name } = body
      const data = await knex('category').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      await knex('category').where({ id }).update({
        name
      })
      return {
        status: true,
        message: 'Category updated successfully !!'
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

  async detail(params){
    try{
        const {id} = params
        const data = await knex('category').where({id}).first()
        if(!data){
          return{
            status:false,
            message:'No data found with id !'
          }
        }

        return{
          status:true,
          message:'Category list fetched successfully !',
          data:data
        }
    } 
    catch(err){
      console.log(err)
      return{
        status:false,
        message:'sonmething went wrong !!'
      }
    }
  }

 async updateStatus(params) {
  try {
    const {id} = params
    const data = await knex('category').where({ id }).first();
    if (!data) {
      return {
        status: false,
        message: 'No category found with this ID',
      };
    }

   
    const newStatus = data.status === 'Active' ? 'InActive' : 'Active';

  
    await knex('category').where({ id }).update({ status: newStatus });

 
    const updated = await knex('category').where({ id }).first();

    return {
      status: true,
      message: `Status updated to ${newStatus} successfully`,
      data: updated,
    };

  } catch (err) {
    console.log(err)
    return {
      status: false,
      message: 'Something went wrong !!',
    };
  }
}

}

export default new categoryService();