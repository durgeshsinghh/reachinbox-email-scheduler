import { sequelize } from '../config/database';
import { User } from './User';
import { Email } from './Email';
import { SlackIntegration } from './SlackIntegration';

User.initModel(sequelize);
Email.initModel(sequelize);
SlackIntegration.initModel(sequelize);

User.hasMany(Email, { foreignKey: 'userId' });
Email.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(SlackIntegration, { foreignKey: 'userId' });
SlackIntegration.belongsTo(User, { foreignKey: 'userId' });

export { User, Email, SlackIntegration, sequelize };
