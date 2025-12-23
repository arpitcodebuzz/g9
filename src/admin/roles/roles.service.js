import knex from "../../common/config/database.config";
import jwt from 'jsonwebtoken'
import { sendRole } from '../../common/config/nodemailer.config'

class rolesService {
  async add(body) {
    try {
      const { email, password, rolename, access } = body

      const existingRole = await knex('roles').where({ email }).first();
      if (existingRole) {
        return {
          status: false,
          message: 'This email is already registered!'
        };
      }

      await knex('roles').insert({
        email,
        password,
        rolename,
        access
      })

      const roleData = { email, password, rolename }
      await sendRole(email, roleData);


      return {
        status: true,
        message: 'Role added successfully !!'
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
      const roles = await knex('roles').select('*').orderBy('createdAt', 'desc');

      const formattedRoles = roles.map(role => ({
        ...role,
        access: JSON.parse(role.access || '[]')
      }));
      return {
        status: true,
        message: 'role fetched successfully ',
        data: formattedRoles
      }

    } catch (err) {
      console.log(err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('roles').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data founnd with this ID'
        }
      }

      await knex('roles').where({ id }).del()

      return {
        status: true,
        message: 'role deleted successfully !!'
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
      const { password, access, rolename } = body
      const data = await knex('roles').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      const updateData = {
        password: password && password.trim() !== "" ? password : data.password,
        access: access && access.trim() !== "" ? access : data.access,
        rolename: rolename && rolename.trim() !== "" ? rolename : data.rolename
      };

      await knex('roles').where({ id }).update(updateData)
      return {
        status: true,
        message: 'role updated successfully !!'
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

  async login(body) {
    try {
      const { email, password } = body;

      if (!email || !password) {
        return { status: false, message: 'Email and password are required' };
      }

      const user = await knex('roles').where({ email }).first();
      if (!user) {
        return {
          status: false,
          message: 'Invalid email !!'
        };
      }

      const users = await knex('roles').where({ password }).first();
      if (!users) {
        return {
          status: false,
          message: 'Invalid password !!'
        };
      }

      const status = users.status
      if (status !== 'Active') {
        return {
          status: false,
          message: 'Your Account is not Active !!'
        }
      }

      const secret_key = process.env.JWT_SECRET_KEY

      const token = jwt.sign(
        { id: user.id, email: user.email, rolename: user.rolename },
        secret_key,
        { expiresIn: '365 days' }
      );

      return {
        status: true,
        message: 'Login successful',
        data: {
          token,
          access: JSON.parse(user.access || '[]')
        }
      };
    } catch (err) {
      console.log(err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }

  async updateStatus(body) {
    try {
      const { id } = body
      const record = await knex("roles").where({ id }).first();

      if (!record) {
        return res.status(404).json({
          status: false,
          message: "Record not found"
        });
      }

      const newStatus = record.status === "Active" ? "Inactive" : "Active";

      await knex("roles")
        .where({ id })
        .update({ status: newStatus });

      return {
        status: true,
        message: `Status updated to ${newStatus}`,
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