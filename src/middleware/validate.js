const { validationResult } = require('express-validator');
const Joi = require('joi');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

const validateRegistration = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().trim(),
        password: Joi.string().min(6).required(),
        phone_number: Joi.string().required().trim(),
        sponsor_username: Joi.string().required().trim(),
        placement_username: Joi.string().required().trim(),
        position: Joi.number().valid(1, 2).required()
    });

    return schema.validate(data);
};

const validateLogin = (data) => {
    const schema = Joi.object({
        username: Joi.string().required().trim(),
        password: Joi.string().required()
    });

    return schema.validate(data);
};

const validatePackage = (data) => {
    const schema = Joi.object({
        name: Joi.string().required().trim(),
        description: Joi.string().required().trim(),
        price: Joi.number().required().min(0),
        level: Joi.number().required().min(1),
        features: Joi.array().items(Joi.string()),
        is_active: Joi.boolean().default(true),
        max_referrals: Joi.number().min(0),
        commission_rate: Joi.number().min(0).max(100),
        validity_days: Joi.number().min(1)
    });

    return schema.validate(data);
};

const validatePayment = (data) => {
    const schema = Joi.object({
        package_id: Joi.number().required(),
        payment_method: Joi.string().valid('bank_transfer', 'mobile_money', 'card').required(),
        payment_reference: Joi.string().required().trim()
    });

    return schema.validate(data);
};

const validateWithdrawal = (data) => {
    const schema = Joi.object({
        amount: Joi.number().required().min(1),
        payment_method: Joi.string().valid('bank_transfer', 'mobile_money').required(),
        phone_number: Joi.string().when('payment_method', {
            is: 'mobile_money',
            then: Joi.string().required().trim(),
            otherwise: Joi.string().optional()
        }),
        bank_name: Joi.string().when('payment_method', {
            is: 'bank_transfer',
            then: Joi.string().required().trim(),
            otherwise: Joi.string().optional()
        }),
        account_number: Joi.string().when('payment_method', {
            is: 'bank_transfer',
            then: Joi.string().required().trim(),
            otherwise: Joi.string().optional()
        })
    });

    return schema.validate(data);
};

module.exports = { 
    validate, 
    validatePackage,
    validateRegistration,
    validateLogin,
    validatePayment,
    validateWithdrawal
};
