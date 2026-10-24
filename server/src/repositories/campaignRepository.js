/**
 * All database access for campaign analytics.
 * Dimension names are mapped to fixed model columns; filter values are bound
 * by Sequelize, which is the SQL-injection defense.
 */

import { Op } from 'sequelize';
import { DIMENSION_COLUMNS } from '../config/campaign.js';

function buildWhere({ lga, ward, activityType, from, to }) {
  const where = {};

  if (lga !== undefined) {
    where.lga = lga;
  }
  if (ward !== undefined) {
    where.ward = ward;
  }
  if (activityType !== undefined) {
    where.activity_type = activityType;
  }
  if (from !== undefined || to !== undefined) {
    where.activity_date = {};
    if (from !== undefined) {
      where.activity_date[Op.gte] = from;
    }
    if (to !== undefined) {
      where.activity_date[Op.lte] = to;
    }
  }

  return where;
}

function buildAggregateAttributes(sequelize) {
  return [
    [sequelize.fn('COUNT', sequelize.col('id')), 'total_activities'],
    [sequelize.fn('SUM', sequelize.col('contact_count')), 'total_contacts'],
    [sequelize.fn('SUM', sequelize.col('amount_spent')), 'total_spend'],
  ];
}

/**
 * Produces YYYY-MM-DD period labels in SQL so timezone conversion cannot shift
 * a weekly or monthly bucket into a neighbouring day on the API server.
 */
function buildPeriodExpression(sequelize, bucket) {
  return sequelize.fn(
    'to_char',
    sequelize.fn('date_trunc', bucket, sequelize.col('activity_date')),
    'YYYY-MM-DD',
  );
}

export function createCampaignRepository(model) {
  const sequelize = model.sequelize;

  async function getGroupedSummary(query) {
    const column = DIMENSION_COLUMNS[query.groupBy];
    if (!column) {
      throw new Error(`Unsupported grouping dimension: ${String(query.groupBy)}`);
    }

    return model.findAll({
      attributes: [
        [sequelize.col(column), 'group'],
        ...buildAggregateAttributes(sequelize),
      ],
      where: buildWhere(query),
      group: [sequelize.col(column)],
      order: [[sequelize.col(column), 'ASC']],
      raw: true,
    });
  }

  async function getTotals(query) {
    const rows = await model.findAll({
      attributes: buildAggregateAttributes(sequelize),
      where: buildWhere(query),
      raw: true,
    });

    return rows[0] ?? {};
  }

  async function getTrend({ bucket, ...query }) {
    const period = buildPeriodExpression(sequelize, bucket);

    return model.findAll({
      attributes: [[period, 'period'], ...buildAggregateAttributes(sequelize)],
      where: buildWhere(query),
      group: [period],
      order: [[period, 'ASC']],
      raw: true,
    });
  }

  async function getCoverage(query) {
    return model.findAll({
      attributes: [
        [sequelize.col('lga'), 'lga'],
        [sequelize.col('activity_type'), 'activity_type'],
        ...buildAggregateAttributes(sequelize),
      ],
      where: buildWhere(query),
      group: [sequelize.col('lga'), sequelize.col('activity_type')],
      order: [
        [sequelize.col('lga'), 'ASC'],
        [sequelize.col('activity_type'), 'ASC'],
      ],
      raw: true,
    });
  }

  return { getGroupedSummary, getTotals, getTrend, getCoverage };
}
