import knex from "../../common/config/database.config";


class metalsService {
  async add(body) {
    try {
      const { name } = body
      if (!name) {
        return {
          status: false,
          message: 'Name is required !!'
        }
      }

      const exists = await knex('metals')
        .where('name', name.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'Metals already exixts !!'
        }
      }

      await knex('metals').insert({
        name
      })

      return {
        status: true,
        message: 'Product metal added succesfully !!'
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
      const data = await knex('metals').select().orderBy('createdAt', 'desc')
      if (!data.length > 0) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'Product metals list fetched successfully !!',
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
      const data = await knex('metals').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('metals').where({ id }).del()

      return {
        status: true,
        message: 'Product metals deleted successfully !!'
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
      const { name } = body
      const data = await knex('metals').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      const exists = await knex('metals')
        .where('name', name.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'Metals already exixts !!'
        }
      }



      await knex('metals').where({ id }).update({
        name
      })
      return {
        status: true,
        message: 'Product metals updated successfully !!'
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
      const data = await knex('metals').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with id !'
        }
      }

      return {
        status: true,
        message: 'metals list fetched successfully !',
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

export default new metalsService()