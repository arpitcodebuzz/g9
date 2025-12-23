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

      const exists = await knex('goldPurity')
        .where('name', name.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'goldPurity already exixts !!'
        }
      }


      await knex('goldPurity').insert({
        name
      })

      return {
        status: true,
        message: 'Product goldPurity added succesfully !!'
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
      const data = await knex('goldPurity').select().orderBy('createdAt', 'desc')
      if (!data.length > 0) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'Product goldPurity list fetched successfully !!',
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
      const data = await knex('goldPurity').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('goldPurity').where({ id }).del()

      return {
        status: true,
        message: 'Product goldPurity deleted successfully !!'
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
      const data = await knex('goldPurity').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      const exists = await knex('goldPurity')
        .where('name', name.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'goldPurity already exixts !!'
        }
      }

      await knex('goldPurity').where({ id }).update({
        name
      })
      return {
        status: true,
        message: 'Product goldPurity updated successfully !!'
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
      const data = await knex('goldPurity').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with id !'
        }
      }

      return {
        status: true,
        message: 'goldPurity list fetched successfully !',
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