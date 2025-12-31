import knex from "../../common/config/database.config";

class settingService {


  async add(body) {
    try {
      const { deliveryCharge, InsuranceCharge, returnCharge, askPrice, diamondPrices, diamondProfit } = body;

      let settingId;
      const existing = await knex('settings').first();

      if (existing) {
        await knex('settings')
          .where({ id: existing.id })
          .update({
            deliveryCharge,
            InsuranceCharge,
            returnCharge,
            askPrice,
            updatedAt: knex.fn.now()
          });
        settingId = existing.id;
      } else {
        const [id] = await knex('settings').insert({
          deliveryCharge,
          InsuranceCharge,
          returnCharge,
          askPrice
        });
        settingId = id;
      }

      if (Array.isArray(diamondPrices)) {
        for (const d of diamondPrices) {
          const exists = await knex('diamonds')
            .where({ diamondWeight: d.weight })
            .first();

          if (exists) {
            await knex('diamonds')
              .where({ diamondWeight: d.weight })
              .update({
                diamondPrice: d.amount || null,
                diamondProfit: diamondProfit || null,
                updatedAt: knex.fn.now()
              });
          } else {
            await knex('diamonds').insert({
              diamondWeight: d.weight,
              diamondPrice: d.amount || null,
              diamondProfit: diamondProfit || null
            });
          }
        }
      }

      return {
        status: true,
        message: 'Settings and diamond prices saved successfully !!',
      };

    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }



  async list() {
    try {
      const setting = await knex('settings')
        .first()
        .orderBy('createdAt', 'desc');

      if (!setting) {
        return {
          status: false,
          message: 'No settings found !!'
        };
      }

      const diamonds = await knex('diamonds')
        .select('diamondWeight', 'diamondPrice', 'diamondProfit')
        .orderBy('diamondWeight', 'desc');

      const diamondPrices = diamonds.map(d => ({
        weight: d.diamondWeight,
        amount: d.diamondPrice || ""

      }));

      const diamondProfit = diamonds.length > 0 ? diamonds[0].diamondProfit || "" : "";


      return {
        status: true,
        message: 'Settings fetched successfully !!',
        data: {
          id: setting.id,
          deliveryCharge: setting.deliveryCharge,
          InsuranceCharge: setting.InsuranceCharge,
          returnCharge: setting.returnCharge,
          askPrice: setting.askPrice,
          createdAt: setting.createdAt,
          updatedAt: setting.updatedAt,
          diamondPrices,
          diamondProfit
        }
      };

    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
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