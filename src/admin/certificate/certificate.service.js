import knex from "../../common/config/database.config";
import dotenv from "dotenv";
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";
import { converter } from "../../common/config/productImage.config";

dotenv.config();
import path from 'path'
import fs from 'fs'
import { log } from "console";

class certificteService {
  async add(body, files) {
    try {
      // console.log(file,'file')
      const { title, subTitle } = body
      // const image = file ? file.filename : null

      const certificateFile = files?.certificate?.[0];
      const logoFile = files?.logo?.[0];

      if (!certificateFile || !logoFile) {
        return {
          status: false,
          message: 'Certificate and Logo both are required !!'
        };
      }

      const certificateName = certificateFile.filename;
      const logoName = logoFile.filename;


      // const awsUpload = await uploadToS3([file]);
      // const awsUpload = await uploadToS3([certificateFile, logoFile]);

      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'Certificate not added !!'
      //   }
      // }

      const convertC = await converter([certificateFile]);
      console.log("🚀 ~ blogService ~ add ~ convert:", convertC)
      const certificate = convertC.length > 0 ? convertC[0].filename : null;

      const convertL = await converter([logoFile]);
      console.log("🚀 ~ blogService ~ add ~ convert:", convertL)
      const logo = convertL.length > 0 ? convertL[0].filename : null;

      await knex('certificate').insert({
        title,
        subTitle,
        image: certificate,
        logo: logo
      })

      return {
        status: true,
        message: 'certificate added successfully !!'
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
      const data = await knex('certificate').select().orderBy('createdAt', 'desc');
      console.log(data)

      if (!data || data.length === 0) {
        return {
          status: false,
          message: 'Certificate not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        ...item,
        image: item.image ? `${baseUrl}/uploads/certificate/${item.image}` : null,
        logo: item.logo ? `${baseUrl}/uploads/logo/${item.logo}` : null
      }));

      return {
        status: true,
        message: 'Certificate fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
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
      console.log("🚀 ~ certificteService ~ delete ~ id:", id)
      const certificateId = parseInt(id, 10)  // ensure number
      if (isNaN(certificateId)) {
        return { status: false, message: 'Invalid certificate ID !!' }
      }

      const data = await knex('certificate').where({ id: certificateId }).first()
      console.log(data)

      if (!data) {
        return { status: false, message: 'Certificate not found !!' }
      }

      if (data.image) {
        const imagepath = path.join('public/uploads/certificate', data.image)
        // if (fs.existsSync(imagepath)) fs.unlinkSync(imagepath)
        deleteFromS3(`public/uploads/certificate/${data.image}`)
      }

      if (data.logo) {
        const imagepath = path.join('public/uploads/certificate', data.logo)
        // if (fs.existsSync(imagepath)) fs.unlinkSync(imagepath)
        deleteFromS3(`public/uploads/logo/${data.logo}`)
      }

      await knex('certificate').where({ id: certificateId }).del()

      return { status: true, message: 'Certificate deleted successfully !!' }

    } catch (err) {
      console.log(err)
      return { status: false, message: 'Something went wrong !!' }
    }
  }

  async detail(params) {
    try {
      const id = parseInt(params.id, 10);
      if (isNaN(id)) {
        return {
          status: false,
          message: 'Invalid certificate ID !!'
        };
      }

      const data = await knex('certificate').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'Certificate not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const formattedData = {
        ...data,
        image: data.image ? `${baseUrl}/uploads/certificate/${data.image}` : null,
        logo: data.logo ? `${baseUrl}/uploads/certificate/${data.logo}` : null
      };

      return {
        status: true,
        message: 'Certificate detail fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }


  async edit(params, body, files) {
    try {
      const id = parseInt(params.id, 10);
      if (isNaN(id)) {
        return {
          status: false,
          message: 'Invalid certificate ID !!'
        };
      }

      const data = await knex('certificate').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'Certificate not found !!'
        };
      }

      const certificateFile = files?.certificate?.[0];
      const logoFile = files?.logo?.[0]



      // Delete old files from S3 if new ones are uploaded
      let certificate = data.image
      if (certificateFile && data.image) {
        // const certificateUrl = `${process.env.AWS_BUCKET_URL}/certificate/${data.image}`;
        await deleteFromS3(`public/uploads/certificate/${data.image}`);
        const convertC = await converter([certificateFile]);
        console.log("🚀 ~ blogService ~ add ~ convert:", convertC)
        certificate = convertC.length > 0 ? convertC[0].filename : null;
      }

      let logo = data.logo
      if (logoFile && data.logo) {
        // const logoUrl = `${process.env.AWS_BUCKET_URL}/logo/${data.logo}`;
        await deleteFromS3(`public/uploads/logo/${data.logo}`);
        const convertL = await converter([logoFile]);
        console.log("🚀 ~ blogService ~ add ~ convert:", convertL)
        logo = convertL.length > 0 ? convertL[0].filename : null;
      }


      const filesToUpload = [];
      if (certificateFile) filesToUpload.push(certificateFile);
      if (logoFile) filesToUpload.push(logoFile);

      // if (filesToUpload.length) {
      // const awsUpload = await uploadToS3(filesToUpload);
      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'Files not uploaded !!'
      //   };
      // }
      // }

      const updatedData = {
        title: body.title || data.title,
        subTitle: body.subTitle || data.subTitle,
        // image: certificateFile ? certificateFile.filename : data.image,
        // logo: logoFile ? logoFile.filename : data.logo
        image: certificate,
        logo: logo
      };

      await knex('certificate').where({ id }).update(updatedData);

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const formattedData = {
        ...updatedData,
        image: updatedData.image ? `${baseUrl}/uploads/certificate/${updatedData.image}` : null,
        logo: updatedData.logo ? `${baseUrl}/uploads/logo/${updatedData.logo}` : null
      };

      return {
        status: true,
        message: 'Certificate updated successfully !!',
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

export default new certificteService()