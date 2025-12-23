import knex from '../common/config/database.config'
import axios from 'axios';
import { uploadToS3, deleteFromS3 } from "../common/config/awsBucket.config";


class askPriceService {

  async goldType() {
    try {
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://six79jewel.com/api/gold/products',
        headers: {
          'G9': 'b53622db435ddec89209320b9720a7c12ced83ef',
          'Cookie': 'frontend_lang=en_US; session_id=f4ff502aa377309a993a2315f3f88b785e62ddef'
        }
      };

      const response = await axios.request(config)
      console.log("🚀 ~ askPriceService ~ goldType ~ response:", response?.data?.data)
      
      if (!response.data) {
        return {
          status: false,
          message: "No data found.",
          data: []
        }
      }

      return {
        status: true,
        message: "Gold type fetched successfully.",
        data: response?.data?.data
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

  async diamondType() {
    try {

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://six79jewel.com/api/diamond/products',
        headers: {
          'G9': 'b53622db435ddec89209320b9720a7c12ced83ef',
          'Cookie': 'frontend_lang=en_US; session_id=f4ff502aa377309a993a2315f3f88b785e62ddef'
        }
      };
      const response = await axios.request(config)

      if (!response.data) {
        return {
          status: false,
          message: "No data found.",
          data: []
        }
      }

      return {
        status: true,
        message: "Diamond type fetched successfully.",
        data: response?.data?.data
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

  async askPrice(body, file) {
    try {
      // console.log(body)

      const { name, email, mobile_number } = body
      console.log('body', body)
      const askpriceImg = file ? file.filename : null
      if (askpriceImg) {

        const awsUpload = await uploadToS3([file]);
        // console.log("🚀 ~ askPriceService ~ askPrice ~ awsUpload:", awsUpload)

        if (!awsUpload) {
          return {
            status: false,
            message: 'askPrice image not added !!'
          }
        }
      }

      let gold_product = JSON.parse(body.gold_product);
      let diamond_product = JSON.parse(body.diamond_product);

      if (!Array.isArray(diamond_product)) {
        diamond_product = [diamond_product];
      }

      // console.log("gold_product:", gold_product);
      // console.log("diamond_product:", diamond_product);



      let data = JSON.stringify({
        gold_product,
        diamond_product
      });

      // let data = JSON.stringify({
      //   "gold_product": gold_product,
      //   "diamond_product": diamond_product
      // });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://six79jewel.com/api/askprice',
        headers: {
          'Content-Type': 'application/json',
          'G9': 'b53622db435ddec89209320b9720a7c12ced83ef',
          'Cookie': 'session_id=4ea8718a0ec8bcc4c62303f9d8a64bd5b8a36dc2; frontend_lang=en_US'
        },
        data: data
      };

      const response = await axios.request(config)

      if (!response.data) {
        return {
          status: false,
          message: "No data found.",
          data: []
        }
      }

      const askPriceReq = { gold_product: gold_product, diamond_product: diamond_product }

      // console.log(response?.data?.data)

      const profitData = await knex("settings").first()
      const profit = profitData.askPrice ? Number(profitData.askPrice) : 8
      const resData = response?.data?.data
      for (const key in resData) {
        const item = resData[key];

        const totalProfit = (item.without_tax * profit) / 100
        item.without_tax = Number((item.without_tax + totalProfit).toFixed(2))

        const totalGst = Number(((item.without_tax * 1.5) / 100).toFixed(2))
        item.taxes = [
          {
            '1.5% SGST S': totalGst
          },
          { '1.5% CGST S': totalGst }
        ]
        item.total = Number((item.without_tax + totalGst + totalGst).toFixed(2))
      }

      const [id] = await knex("ask_price").insert({
        name: name,
        email: email,
        mobile_number: mobile_number,
        askPriceReq: askPriceReq,
        askPriceRes: resData,
        image: askpriceImg
      })

      return {
        status: true,
        message: "Gold pricing calculated successfully.",
        id: id,
        data: resData
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

  async getAskprice(id) {
    try {

      const data = await knex("ask_price").where({ id: id }).first().orderBy('createdAt', 'desc');

      if (!data) {
        return {
          status: false,
          message: "Data not found",
          data: {}
        }
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const imageUrl = data.image ? `${baseUrl}/uploads/askpriceImg/${data.image}` : null;

      const finalData = {
        name: data?.name,
        email: data?.email,
        mobile_number: data?.mobile_number,
        askPriceReq: JSON.parse(data?.askPriceReq),
        askPriceRes: JSON.parse(data?.askPriceRes),
        image: imageUrl
      }

      return {
        status: true,
        message: "Data fetched successfully.",
        data: finalData
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

export default new askPriceService()