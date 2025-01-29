module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('health_checks', {
        check_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        datetime: {
          type: Sequelize.DATE
        },
      }
    );
    },
    
  };