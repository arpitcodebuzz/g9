import knex from "../../common/config/database.config";

class policyService {
  async add(body) {
    try {
      const { name, description } = body
      await knex('policy').insert({
        name, description
      })

      function startsWithCapital(str) {
        return /^[A-Z]/.test(str);
      }

      // if (!startsWithCapital(name)) {
      //   return {
      //     status: false,
      //     message: 'Name must start with a capital letter !'
      //   };
      // }
      
      return {
        status: true,
        message: 'policy added successfully !!'
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

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('policy').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('policy').where({ id }).del()

      return {
        status: true,
        message: 'policy deleted successfully !!'
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

  async edit(body, params) {
    try {
      const { id } = params
      const { name, description } = body
      const data = await knex('policy').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      const updateData = {
        name: name && name.trim() !== "" ? name : data.name,
        description: description && description.trim() !== "" ? description : data.description
      };

      await knex('policy').where({ id }).update(updateData)
      return {
        status: true,
        message: 'policy updated successfully !!'
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

  async detail(params) {
    try {
      const { id } = params
      const data = await knex('policy').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with id !'
        }
      }

      return {
        status: true,
        message: 'policy list fetched successfully !',
        data: data
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'sonmething went wrong !!'
      }
    }
  }

}

export default new policyService()