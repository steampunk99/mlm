const Joi = require('joi');

const withdrawalRequestSchema = Joi.object({
    amount: Joi.number()
        .required()
        .min(10) // Minimum withdrawal amount
        .precision(2),
    
    withdrawal_method: Joi.string()
        .valid('bank_transfer', 'mobile_money', 'crypto')
        .required(),
    
    // Bank transfer fields
    bank_name: Joi.string()
        .when('withdrawal_method', {
            is: 'bank_transfer',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    
    account_number: Joi.string()
        .when('withdrawal_method', {
            is: 'bank_transfer',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    
    account_name: Joi.string()
        .when('withdrawal_method', {
            is: 'bank_transfer',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    
    // Mobile money fields
    mobile_number: Joi.string()
        .pattern(/^[0-9]+$/)
        .min(10)
        .max(15)
        .when('withdrawal_method', {
            is: 'mobile_money',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    
    mobile_network: Joi.string()
        .when('withdrawal_method', {
            is: 'mobile_money',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    
    // Crypto fields
    crypto_address: Joi.string()
        .when('withdrawal_method', {
            is: 'crypto',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    
    crypto_network: Joi.string()
        .when('withdrawal_method', {
            is: 'crypto',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        })
});

const withdrawalUpdateSchema = Joi.object({
    status: Joi.string()
        .valid('processing', 'completed', 'rejected', 'cancelled')
        .required(),
    
    admin_note: Joi.string()
        .allow('', null),
    
    rejection_reason: Joi.string()
        .when('status', {
            is: 'rejected',
            then: Joi.required(),
            otherwise: Joi.allow('', null)
        }),
    
    transaction_hash: Joi.string()
        .when('status', {
            is: 'completed',
            then: Joi.when('withdrawal_method', {
                is: 'crypto',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            })
        })
});

const withdrawalFilterSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'processing', 'completed', 'rejected', 'cancelled'),
    
    withdrawal_method: Joi.string()
        .valid('bank_transfer', 'mobile_money', 'crypto'),
    
    start_date: Joi.date(),
    
    end_date: Joi.date()
        .min(Joi.ref('start_date')),
    
    min_amount: Joi.number()
        .min(0)
        .precision(2),
    
    max_amount: Joi.number()
        .min(Joi.ref('min_amount'))
        .precision(2),
    
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
});

module.exports = {
    validateWithdrawalRequest: (data) => withdrawalRequestSchema.validate(data),
    validateWithdrawalUpdate: (data) => withdrawalUpdateSchema.validate(data),
    validateWithdrawalFilter: (data) => withdrawalFilterSchema.validate(data)
};
