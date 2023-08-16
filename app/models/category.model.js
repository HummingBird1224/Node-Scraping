module.exports = ( sequelize, Sequelize ) =>
{
  const categoryList = sequelize.define( "categories", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING
    },
    bc_id: {
      type: Sequelize.INTEGER
    },
  },
    {
      timestamps: true
    } );
  return categoryList;
};