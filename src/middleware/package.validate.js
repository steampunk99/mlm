const Joi = require('joi');

const packageCreateSchema = Joi.object({
    name: Joi.string()
        .required()
        .min(3)
        .max(100)
        .trim(),
    
    price: Joi.number()
        .required()
        .min(0)
        .precision(2),
    
    description: Joi.string()
        .allow('')
        .max(1000),
    
    benefits: Joi.object()
        .default({}),
    
    level: Joi.number()
        .integer()
        .min(1)
        .required(),
    
    max_daily_earnings: Joi.number()
        .required()
        .min(0)
        .precision(2),
    
    binary_bonus_percentage: Joi.number()
        .min(0)
        .max(100)
        .precision(2)
        .default(10),
    
    referral_bonus_percentage: Joi.number()
        .min(0)
        .max(100)
        .precision(2)
        .default(10)
});

const packageUpdateSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .trim(),
    
    price: Joi.number()
        .min(0)
        .precision(2),
    
    description: Joi.string()
        .allow('')
        .max(1000),
    
    benefits: Joi.object(),
    
    level: Joi.number()
        .integer()
        .min(1),
    
    max_daily_earnings: Joi.number()
        .min(0)
        .precision(2),
    
    binary_bonus_percentage: Joi.number()
        .min(0)
        .max(100)
        .precision(2),
    
    referral_bonus_percentage: Joi.number()
        .min(0)
        .max(100)
        .precision(2),
    
    status: Joi.string()
        .valid('active', 'inactive')
});

const packagePurchaseSchema = Joi.object({
    package_id: Joi.number()
        .integer()
        .required(),
    
    payment_method: Joi.string()
        .valid('bank_transfer', 'mobile_money', 'card')
        .required(),
    
    phone_number: Joi.string()
        .pattern(/^[0-9]+$/)
        .min(10)
        .max(15)
        .when('payment_method', {
            is: 'mobile_money',
            then: Joi.required()
        })
});

const packageUpgradeSchema = Joi.object({
    current_package_id: Joi.number()
        .integer()
        .required(),
    
    new_package_id: Joi.number()
        .integer()
        .required(),
    
    payment_method: Joi.string()
        .valid('bank_transfer', 'mobile_money', 'card')
        .required(),
    
    phone_number: Joi.string()
        .pattern(/^[0-9]+$/)
        .min(10)
        .max(15)
        .when('payment_method', {
            is: 'mobile_money',
            then: Joi.required()
        })
});

module.exports = {
    validatePackageCreate: (data) => packageCreateSchema.validate(data),
    validatePackageUpdate: (data) => packageUpdateSchema.validate(data),
    validatePackagePurchase: (data) => packagePurchaseSchema.validate(data),
    validatePackageUpgrade: (data) => packageUpgradeSchema.validate(data)
};
