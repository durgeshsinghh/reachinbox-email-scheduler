import { Model, DataTypes, Sequelize } from 'sequelize';
import { SlackIntegrationAttributes } from '../types';

export class SlackIntegration extends Model<SlackIntegrationAttributes> implements SlackIntegrationAttributes {
  public id!: string;
  public userId!: string;
  public teamId!: string;
  public teamName!: string;
  public accessToken!: string;
  public webhookUrl!: string | null;
  public channelId!: string;
  public channelName!: string;

  static initModel(sequelize: Sequelize) {
    SlackIntegration.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
        },
        teamId: {
          type: DataTypes.STRING,
        },
        teamName: {
          type: DataTypes.STRING,
        },
        accessToken: {
          type: DataTypes.STRING(500),
        },
        webhookUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        channelId: {
          type: DataTypes.STRING,
        },
        channelName: {
          type: DataTypes.STRING,
        },
      },
      {
        sequelize,
        tableName: 'slack_integrations',
        timestamps: true,
      }
    );
  }
}
