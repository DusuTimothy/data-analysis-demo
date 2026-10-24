/**
 * Read-only Sequelize model over the analytics view.
 * Every attribute is listed explicitly so SELECT * can never expose a
 * sensitive column that exists on the upstream base table.
 */

import { DataTypes } from 'sequelize';
import { ACTIVITY_TYPES } from '../config/campaign.js';

export const ANALYTICS_VIEW_NAME = 'analytics_campaign_activities';

export function initCampaignActivity(sequelize) {
  return sequelize.define(
    'CampaignActivity',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
      },
      activity_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [ACTIVITY_TYPES] },
      },
      lga: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ward: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      polling_unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contact_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      amount_spent: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      activity_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: ANALYTICS_VIEW_NAME,
      timestamps: false,
      // Reads only. Schema changes are managed outside this application.
      freezeTableName: true,
    },
  );
}
