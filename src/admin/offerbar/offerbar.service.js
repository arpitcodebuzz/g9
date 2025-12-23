import knex from "../../common/config/database.config";


class metalsService {
  async add(body) {
    try {
      const { text } = body
      if (!text) {
        return {
          status: false,
          message: 'text is required !!'
        }
      }

       function startsWithCapital(str) {
        return /^[A-Z]/.test(str);
      }

       if (!startsWithCapital(text)) {
        return { 
          status: false,
           message: 'Text must start with a capital letter !' 
          };
      }

      const exists = await knex('offerbar')
        .where('text', text.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'text already exixts !!'
        }
      }

      await knex('offerbar').insert({
        text
      })

      return {
        status: true,
        message: 'Data added succesfully !!'
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
      const data = await knex('offerbar').select().orderBy('createdAt', 'desc')
      if (!data.length > 0) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'offerbar list fetched successfully !!',
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
      const data = await knex('offerbar').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('offerbar').where({ id }).del()

      return {
        status: true,
        message: 'offerbar deleted successfully !!'
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
      const { text } = body
      const data = await knex('offerbar').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      const exists = await knex('offerbar')
        .where('text', text.toLowerCase()).first()

      if (exists) {
        return {
          status: false,
          message: 'offerbar already exixts !!'
        }
      }

      await knex('offerbar').where({ id }).update({
        text
      })
      return {
        status: true,
        message: 'offerbar updated successfully !!'
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
      const data = await knex('offerbar').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with id !'
        }
      }

      return {
        status: true,
        message: 'offerbar list fetched successfully !',
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