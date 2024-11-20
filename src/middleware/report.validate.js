const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const reportValidation = {
    // Validate date range
    validateDateRange: (req, res, next) => {
        const schema = Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().min(Joi.ref('startDate')).required()
        });

        const { error } = schema.validate(req.query);
        if (error) {
            throw new ApiError(400, error.details[0].message);
        }
        next();
    },

    // Validate report type
    validateReportType: (req, res, next) => {
        const schema = Joi.object({
            type: Joi.string().valid('EARNINGS', 'NETWORK', 'PACKAGE', 'WITHDRAWAL', 'COMMISSION').required()
        });

        const { error } = schema.validate(req.query);
        if (error) {
            throw new ApiError(400, error.details[0].message);
        }
        next();
    },

    // Validate report history filters
    validateHistoryFilters: (req, res, next) => {
        const schema = Joi.object({
            type: Joi.string().valid('EARNINGS', 'NETWORK', 'PACKAGE', 'WITHDRAWAL', 'COMMISSION'),
            startDate: Joi.date(),
            endDate: Joi.date().min(Joi.ref('startDate')),
            limit: Joi.number().integer().min(1).max(100),
            page: Joi.number().integer().min(1)
        });

        const { error } = schema.validate(req.query);
        if (error) {
            throw new ApiError(400, error.details[0].message);
        }
        next();
    }
};

module.exports = reportValidation;
