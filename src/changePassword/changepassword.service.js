import knex from "../common/config/database.config";
import bcrypt from 'bcrypt'

class changepasswordService {
  async changePassword(authUser, body) {
    try {
      const userId = authUser.id
      // console.log(userId)
      const { OldPassword, NewPassword, Confirmpassword } = body

      const data = await knex('users').where({ id: userId }).first()
      if (!data) {
        return {
          status: false,
          message: 'No user found with this id !!'
        }
      }
      // console.log(data.password, 'data')

      const isMatch = await bcrypt.compare(OldPassword, data.password)
      if (!isMatch) {
        return {
          status: false,
          message: 'OldPassword is Invalid !!'
        }
      }

      if (NewPassword !== Confirmpassword) {
        return {
          status: false,
          message: 'Newpassword and confirmpassword not matched !!'
        }
      }

      const hashedPassword = await bcrypt.hash(NewPassword, 10);

      await knex('users').where({ id: userId }).update({ password: hashedPassword })
      return {
        status: true,
        message: 'Password changed successfully !!'
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

export default new changepasswordService()