/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('users',(table)=>{
       table.increments('id').primary()
       table.string('name').nullable()
       table.string('email').nullable()
       table.string('Mobile_number').nullable()
       table.string('password').nullable()
       table.string('step').defaultTo(0)
       table.enum('status',['Active','InActive']).defaultTo('Active')
       table.string('otp').nullable()
       table.string('otpExpireTime').nullable()
       table.timestamp('createdAt').defaultTo(knex.fn.now())
       table.timestamp('updatedAt').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
   return knex.schema.dropTable('users')
};
