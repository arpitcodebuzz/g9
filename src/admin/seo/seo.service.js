import knex from "../../common/config/database.config";

class rolesService {
  async add(body) {
    try {
      const { metaTitle, metaDescription, routes, productId } = body

      await knex('seo').insert({
        metaTitle,
        metaDescription,
        routes,
        productId
      })

      return {
        status: true,
        message: 'seo added successfully !!'
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
      const seo = await knex('seo').select('*').orderBy('createdAt', 'desc');

      if (!seo) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'seo fetched successfully ',
        data: seo
      }

    } catch (err) {
      console.log(err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('seo').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('seo').where({ id }).del()

      return {
        status: true,
        message: 'seo deleted successfully !!'
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
      const { metaTitle, metaDescription, pageName, routes, productId } = body
      const data = await knex('seo').where({ id }).first()
      if (!data) {
        return {
          status: true,
          message: 'No data found with this id !!'
        }
      }

      const updateData = {
        metaTitle: metaTitle ? metaTitle : data.metaTitle,
        metaDescription: metaDescription ? metaDescription : data.metaDescription,
        pageName: pageName ? pageName : data.pageName,
        routes: routes ? routes : data.routes,
        productId: productId ? productId : data.productId
      };

      await knex('seo').where({ id }).update(updateData)
      return {
        status: true,
        message: 'seo updated successfully !!'
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
      const data = await knex('seo').where('id', id).first();
      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'Data fetched successfully !!',
        data: data
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

export default new rolesService()