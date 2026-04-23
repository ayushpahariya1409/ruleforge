const User = require('../models/sql/User');

class UserRepository {
  async create(userData) {
    return User.create(userData);
  }

  async findByEmail(email) {
    // We use the 'withPassword' scope defined in the SQL model to include password field
    return User.scope('withPassword').findOne({ where: { email } });
  }

  async findByGoogleId(googleId) {
    return User.findOne({ where: { googleId } });
  }

  async findById(id) {
    return User.findByPk(id);
  }

  async findAll() {
    return User.findAll();
  }
}

module.exports = new UserRepository();
