import knex from '../common/config/database.config'
import blogResource from '../admin/blogs/resources/blog.resource'

class blogService {
  async list(query) {
    try {
      const { perPage, page } = query
      const qb = knex('blogs').select().orderBy('createdAt', 'desc')

      const data = await qb.paginate({
        perPage: perPage ? parseInt(perPage) : 10,
        currentPage: page ? parseInt(page) : 1,
        isLengthAware: true
      })

      const blogData = data.data.map((data) => new blogResource(data))
      return {
        status: true,
        message: 'Blogs list fetched successfully !!',
        data: blogData,
        pagination: data.pagination
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

  async detail(params) {
    try {
      const { id } = params
      const data = await knex('blogs').where({ id }).first();
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }
      const blogData = new blogResource(data);

      return {
        status: true,
        message: 'Blogs data deleted successfully !!',
        data: blogData
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

export default new blogService()