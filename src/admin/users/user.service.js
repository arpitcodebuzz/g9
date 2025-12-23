import knex from '../../common/config/database.config'
import UserResource from './resources/user.resource'

class userService {
  async list(query) {
    try {
      const { startDate, endDate } = query;

      const usersQb = knex('users')
        .select(
          'id as userId',
          'name',
          'email',
          'Mobile_number',
          'status',
          'registrationType',
          'profile',
          'createdAt'
        )
        .orderBy('createdAt', 'desc');

      if (startDate && endDate) {
        usersQb.whereBetween(knex.raw('DATE(createdAt)'), [startDate, endDate]);
      } else if (startDate) {
        usersQb.where(knex.raw('DATE(createdAt)'), '>=', startDate);
      } else if (endDate) {
        usersQb.where(knex.raw('DATE(createdAt)'), '<=', endDate);
      }

      // const paginatedUsers = await usersQb.paginate({
      //   perPage: perPage ? parseInt(perPage) : 10,
      //   currentPage: page ? parseInt(page) : 1,
      //   isLengthAware: true
      // });

      const users = await usersQb;

      const userIds = users.map(user => user.userId);

    

      const addresses = await knex('user_address').whereIn('user_id', userIds);
      const orders = await knex('orders').whereIn('userId', userIds).select('userId');

      const orderMap = {};
      userIds.forEach(id => {
        orderMap[id] = 0;
      });
      orders.forEach(order => {
        orderMap[order.userId] += 1;
      });

      const userMap = {};
      users.forEach(user => {
        userMap[user.userId] = {
          ...user,
          orderCount: orderMap[user.userId] || 0,
          addresses: []
        };
      });

      addresses.forEach(addr => {
        if (userMap[addr.user_id]) {
          userMap[addr.user_id].addresses.push({
            address_line_1: addr.address_line_1,
            address_line_2: addr.address_line_2,
            city: addr.city,
            state: addr.state,
            country: addr.country,
            postal_code: addr.postal_code,
            address_type: addr.address_type,
            primary: addr.primary,
          });
        }
      });

      const baseUrl = process.env.PRODUCT_BASE_URL || '';

      const mergedUsers = users.map(user => {
        return {
          ...userMap[user.userId],
          profile: userMap[user.userId].profile
            ? `${baseUrl}/uploads/profile/${userMap[user.userId].profile}`
            : null
        };
      });

      return {
        status: true,
        data: {
          data: mergedUsers
        },
        message: 'User list fetched successfully !!'
      };


    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }


  async detail(params) {
    try {
      const { id } = params;
      const baseUrl = process.env.PRODUCT_BASE_URL || '';

      const data = await knex('users')
        .leftJoin('user_address', 'users.id', 'user_address.user_id')
        .select(
          'users.id as userId',
          'users.name',
          'users.email',
          'users.Mobile_number',
          'users.status',
          'users.registrationType',
          'users.profile',
          'user_address.address_line_1',
          'user_address.address_line_2',
          'user_address.city',
          'user_address.state',
          'user_address.country',
          'user_address.postal_code',
          'user_address.address_type'
        )
        .where('users.id', id)
        .first();

      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        };
      }

      if (data.profile) {
        data.profile = `${baseUrl}/uploads/profile/${data.profile}`;
      } else {
        data.profile = null;
      }

      return {
        status: true,
        message: 'User list fetched successfully !!',
        data: data
      };
    } catch (err) {
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
      const data = await knex('users')
        .where('id', id)
        .first();

      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      await knex('user_address').where('user_id', id)
        .del();

      await knex('users').where('id', id)
        .del();

      return {
        status: true,
        message: 'User deleted successfully !!'
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

  async updateStatus(params) {
    try {
      const { id } = params;

      const user = await knex('users').where({ id }).first();

      if (!user) {
        return {
          status: false,
          message: 'User not found !!',
        };
      }

      const currentStatus = user.status?.toLowerCase();
      let newStatus;
      let tokenRevoked = false;

      if (currentStatus === 'active') {
        newStatus = 'Inactive';
        tokenRevoked = true;
      } else if (currentStatus === 'inactive') {
        newStatus = 'Active';
        tokenRevoked = false;
      } else {
        return {
          status: false,
          message: `Invalid current status: ${user.status}`,
        };
      }

      let updatedCount = await knex('users')
        .where({ id })
        .update({ status: newStatus });
      // console.log(updatedCount,'updatedCount')

      if (updatedCount > 0) {
        await knex('user_access_token')
          .where({ userId: id, revoked: false })
          .update({ revoked: true });
      }


      return {
        status: true,
        message: `Status updated successfully to ${newStatus} !!`,
      };
    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong !!',
      };
    }
  }




}

export default new userService()