import knex from "../common/config/database.config";
import dotenv from "dotenv";
import { uploadToS3, deleteFromS3 } from "../common/config/awsBucket.config";
import { converter } from "../common/config/productImage.config";


dotenv.config();

class accountService {
  async list(authUser) {
    try {
      const data = await knex('users').select('id', 'name', 'email', 'Mobile_number', 'profile')
        .where({ id: authUser.id })
      if (!data) {
        return {
          status: false,
          message: 'Account list not found !!'
        }
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const userdata = data.map(item => ({
        ...item,
        profile: item.profile ? `${baseUrl}/uploads/profile/${item.profile}` : null
      }))

      return {
        status: true,
        message: 'User Account fetched successfully !!',
        data: userdata[0]


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


  async edit(body, file, authUser) {
    try {
      const { name, email, Mobile_number } = body
      // const image = file ? file.filename : null



      const userId = authUser.id
      // console.log(userId, 'userId')

      if (file && file.size > 5 * 1024 * 1024) {
        console.log(`Uploaded image size is too large: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        return {
          status: false,
          message: 'Image size should not exceed 5MB !!'
        };
      }

      const data = await knex('users').where({ id: userId }).first();
      // console.log("🚀 ~ accountService ~ edit ~ data:", data)
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      let image = data.profile
      if (file) {
        const convert = await converter([file]);
        console.log("🚀 ~ blogService ~ add ~ convert:", convert)
        image = convert.length > 0 ? convert[0].filename : null;
        deleteFromS3(`public/uploads/profile/${data.profile}`)
      }

      // const awsUpload = await uploadToS3([file]);

      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'User Account not updated !!'
      //   }
      // }

      const updateData = {
        name: name && name.trim() !== "" ? name : data.name,
        email: email && email.trim() !== "" ? email : data.email,
        Mobile_number: Mobile_number && Mobile_number.trim() !== "" ? Mobile_number : data.Mobile_number,
        profile: image && image.trim() !== "" ? image : data.profile
      };

      await knex('users').where({ id: userId }).update(updateData)

      return {
        status: true,
        message: 'User Account updated successfully !!',
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

  async userAddress(authUser) {
    try {
      const data = await knex('user_address').where({ user_id: authUser.id, primary: 1 }).select()
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }
      return {
        status: true,
        message: 'User Address fetched successfully !!',
        data: data[0]
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

export default new accountService()