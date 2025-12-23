import knex from "../common/config/database.config";

class addressService {
  async list(authUser) {
    try {
      const data = await knex('user_address').where({ user_id: authUser.id }).select().orderBy('primary', 'desc');
      if (!data || data.length === 0) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }
      return {
        status: true,
        message: 'User Address list fetched successfully !!',
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

  async setPrimary(params) {
    try {
      const { id } = params;

      const data = await knex('user_address').where({ id }).first();
      if (!data) {
        return {
          status: true,
          message: 'No data found'
        };
      }

      const userId = data.user_id;

      await knex('user_address')
        .where({ user_id: userId })
        .update({ primary: false });

      await knex('user_address')
        .where({ id })
        .update({ primary: true });

      return {
        status: true,
        message: 'Primary Address updated successfully !!'
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

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('user_address').where({ id }).first()
      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }

      await knex('user_address').where({ id }).del()
      return {
        status: true,
        message: 'User Address deleted successfully !!'
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

  async edit(params, body) {
    try {
      const { id } = params;

      const data = await knex('user_address').where({ id }).first();
      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        };
      }

      const fieldsToUpdate = {};
      const allowedFields = [
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'postal_code',
        'address_type'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined && body[field] !== '') {
          fieldsToUpdate[field] = body[field];
        }
      });

      if (Object.keys(fieldsToUpdate).length === 0) {
        return {
          status: false,
          message: 'No valid data provided for update !!'
        };
      }

      await knex('user_address').where({ id }).update(fieldsToUpdate);

      return {
        status: true,
        message: 'User Address updated successfully !!',
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }


}

export default new addressService()