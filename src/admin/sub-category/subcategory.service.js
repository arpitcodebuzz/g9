import knex from '../../common/config/database.config'

class subcategoryService {
  async add(body) {
    try {
      const { categoryId, name } = body

      const exists = await knex('subCategory')
        .where('categoryId', categoryId)
        .andWhere('name', name.toLowerCase())
        .first()

      if (exists) {
        return {
          status: false,
          message: 'SubCategory already exists !!'
        }
      }

      await knex('subCategory').insert({
        categoryId,
        name
      })

      return {
        status: true,
        message: 'Subcategory added successfully !!'
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
      const data = await knex('subCategory')
        .leftJoin('category', 'subCategory.categoryId', 'category.id')
        .orderBy('subCategory.createdAt', 'desc')
        .select(
          'subCategory.*',
          'category.name as categoryName'
        )

      return {
        status: true,
        data: data,
        message: 'Subcategory list fetched successfully !!'
      };
    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong'
      };
    }
  }

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('subCategory').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id'
        }
      }

      await knex('subCategory').where({ id }).del()
      return {
        status: true,
        message: 'Subcategory deleted successfully !!'
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

  async edit(body, params) {
    try {
      const { id } = params
      const { name } = body
      const data = await knex('subCategory').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      await knex('subCategory').where({ id }).update({
        name
      })
      return {
        status: true,
        message: 'SubCategory updated successfully !!'
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
      const { id } = params;
      const data = await knex('subCategory')
        .leftJoin('category', 'subCategory.categoryId', 'category.id')
        .select('subCategory.*', 'category.name as categoryName')
        .where('subCategory.id', id)
        .first();

      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        };
      }

      return {
        status: true,
        data: data,
        message: 'Subcategory fetched successfully !!'
      };
    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

}

export default new subcategoryService()