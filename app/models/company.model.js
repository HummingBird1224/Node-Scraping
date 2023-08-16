module.exports = ( sequelize, Sequelize ) =>
{
  const companyList = sequelize.define( "tbl_cooperate", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING
    },
    address: {
      type: Sequelize.STRING
    },
    postcode: {
      type: Sequelize.STRING
    },
    city_id: {
      type: Sequelize.INTEGER
    },
  },
    {
      timestamps: false
    } );
  return companyList;
};