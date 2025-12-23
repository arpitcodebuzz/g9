import knex from "../../common/config/database.config";

class settingService {
  async add(body) {
    try {
      const { deliveryCharge, InsuranceCharge, returnCharge, askPrice } = body;

      const existing = await knex('settings').first()

      if (existing) {
        await knex('settings').where({ id: existing.id })
          .update({
            deliveryCharge,
            InsuranceCharge,
            returnCharge,
            askPrice
          })

        return {
          status: true,
          message: 'Charges updated successfully !!'
        }
      }
      else {
        await knex('settings').insert({
          deliveryCharge,
          InsuranceCharge,
          returnCharge,
          askPrice
        });

        return {
          status: true,
          message: 'Charges added successfully !!',
        };
      }


    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async list() {
    try {
      const data = await knex('settings').select().orderBy('createdAt', 'desc')

      if (!data || data.length === 0) {
        return {
          status: false,
          message: 'No settings found !!'
        }
      }

      return {
        status: true,
        message: 'Settings fetched successfully !!',
        data
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

  // async edit(params, body) {
  //   try {
  //     const id = parseInt(params.id, 10)
  //     if (isNaN(id)) return {
  //       status: false,
  //       message: 'Invalid ID !!'
  //     }

  //     const existing = await knex('settings').where({ id }).first()
  //     if (!existing)
  //       return {
  //         status: false,
  //         message: 'Setting not found !!'
  //       }

  //     const updatedData = {
  //       deliveryCharge: body.deliveryCharge ?? existing.deliveryCharge,
  //       InsuranceCharge: body.InsuranceCharge ?? existing.InsuranceCharge,
  //       returnCharge: body.returnCharge ?? existing.returnCharge,
  //       askPrice: body.askPrice ?? existing.askPrice,
  //       updatedAt: knex.fn.now()
  //     }

  //     await knex('settings').where({ id }).update(updatedData)
  //     const updated = await knex('settings').where({ id }).first()

  //     return {
  //       status: true,
  //       message: 'Setting updated successfully !!'
  //     }

  //   }
  //   catch (err) {
  //     console.log(err)
  //     return {
  //       status: false,
  //       message: 'Something went wrong !!'
  //     }
  //   }
  // }


}

export default new settingService()