import knex from "../../common/config/database.config";
import blogResource from '../blogs/resources/blog.resource'
import fs from 'fs'
import path from 'path'
import { converter } from "../../common/config/productImage.config";
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";

class blogService {
  async add(body, file) {
    try {
      const { title, description } = body


      function startsWithCapital(str) {
        return /^[A-Z]/.test(str);
      }

      if (!startsWithCapital(title)) {
        return {
          status: false,
          message: 'Title must start with a capital letter !'
        };
      }

      if (file && file.size > 5 * 1024 * 1024) {
        console.log(`Uploaded image size is too large: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        return {
          status: false,
          message: 'Image size should not exceed 5MB !!'
        };
      }

      // const awsUpload = await uploadToS3([file]);

      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'Blogs not added !!'
      //   }
      // }

      const convert = await converter([file]);
      // console.log("🚀 ~ blogService ~ add ~ convert:", convert)
      const image = convert.length > 0 ? convert[0].filename : null;
      console.log("🚀 ~ blogService ~ add ~ image:", image)

      await knex('blogs').insert({
        title,
        description,
        image
      })

      return {
        status: true,
        message: 'Blogs data added successfully !!'
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
      const data = await knex('blogs').select().orderBy('createdAt', 'desc')
      const blogData = data.map((data) => new blogResource(data))
      return {
        status: true,
        message: 'Blogs list fetched successfully !!',
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

  async detail(params) {
    try {
      const { id } = params
      const data = await knex('blogs').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }
      const blogdata = new blogResource(data);

      return {
        status: true,
        message: 'Blog list fetched successfully !!',
        data: blogdata
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

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('blogs').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !'
        }
      }

      if (data.image) {
        const imagepath = path.join('public/uploads/blogs', data.image)
        // if (fs.existsSync(imagepath)) {
        //   fs.unlinkSync(imagepath)
        // }
        deleteFromS3(`public/uploads/blogs/${data.image}`)
      }

      await knex('blogs').where({ id }).del()
      return {
        status: true,
        message: 'Blog data deleted successfully !!'
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

  async edit(params, body, file) {
    try {
      const { id } = params;
      const { title, description } = body

      const data = await knex('blogs').where({ id }).first();
      console.log("🚀 ~ blogService ~ edit ~ data:", data)
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        };
      }

      let image = data.image
      if (file && data.image) {
        const oldImagePath = path.join(
          __dirname,
          '../../../public/uploads/blogs',
          data.image
        );
        // if (fs.existsSync(oldImagePath)) {
        // fs.unlinkSync(oldImagePath);
        console.log(data.image)
        deleteFromS3(`public/uploads/blogs/${data.image}`)
        // }
        // const awsUpload = await uploadToS3([file]);

        // if (!awsUpload) {
        //   return {
        //     status: false,
        //     message: 'Blogs not added !!'
        //   }
        // }
        const convert = await converter([file]);
        console.log("🚀 ~ blogService ~ add ~ convert:", convert)
        image = convert.length > 0 ? convert[0].filename : null;;
      }

      const updatedData = {
        title: title && title.trim() !== "" ? title : data.title,
        description: description && description.trim() !== "" ? description : data.description,
        image: image,
      };

      await knex('blogs').where({ id }).update(updatedData);

      return {
        status: true,
        message: 'Blog data updated successfully !!',
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

export default new blogService()