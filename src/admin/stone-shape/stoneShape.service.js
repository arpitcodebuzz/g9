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

      const exists = await knex('stoneShape')
        .where('name', name.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'stoneShape already exixts !!'
        }
      }


      await knex('stoneShape').insert({
        name
      })

      return {
        status: true,
        message: 'Product stoneShape added succesfully !!'
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
      const data = await knex('stoneShape').select().orderBy('createdAt', 'desc')
      if (!data.length > 0) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'Product stoneShape list fetched successfully !!',
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
      const data = await knex('stoneShape').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('stoneShape').where({ id }).del()

      return {
        status: true,
        message: 'Product stoneShape deleted successfully !!'
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
      const data = await knex('stoneShape').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      const exists = await knex('stoneShape')
        .where('name', name.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'StoneShape already exixts !!'
        }
      }

      await knex('stoneShape').where({ id }).update({
        name
      })
      return {
        status: true,
        message: 'Product stoneShape updated successfully !!'
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
      const data = await knex('stoneShape').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with id !'
        }
      }

      return {
        status: true,
        message: 'stoneShape list fetched successfully !',
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