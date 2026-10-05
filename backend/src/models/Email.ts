import { Model, DataTypes, Sequelize } from 'sequelize';
import { EmailAttributes, EmailStatus } from '../types';

export class Email extends Model<EmailAttributes> implements EmailAttributes {
  public id!: string;
  public userId!: string;
  public senderEmail!: string;
  public recipientEmail!: string;
  public subject!: string;
  public body!: string;
  public status!: EmailStatus;
  public scheduledAt!: Date;
  public sentAt!: Date | null;
  public jobId!: string | null;
  public batchId!: string | null;
  public etherealUrl!: string | null;
  public errorMessage!: string | null;

  static initModel(sequelize: Sequelize) {
    Email.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        senderEmail: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        recipientEmail: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        subject: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('scheduled', 'queued', 'sending', 'sent', 'failed', 'rate_limited'),
          defaultValue: 'scheduled',
        },
        scheduledAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        sentAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        jobId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        batchId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        etherealUrl: {
          type: DataTypes.STRING(1000),
          allowNull: true,
        },
        errorMessage: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'emails',
        timestamps: true,
        indexes: [
          { fields: ['userId', 'status'] },
          { fields: ['scheduledAt'] },
          { fields: ['batchId'] },
        ],
      }
    );
  }
}
