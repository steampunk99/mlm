const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NodePaymentService {
    async findAll(nodeId, { startDate, endDate, type } = {}) {
        const where = {};

        if (nodeId) {
            where.nodeId = nodeId;
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        if (type) {
            where.type = type;
        }

        return prisma.nodePayment.findMany({
            where,
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return prisma.nodePayment.findUnique({
            where: { id },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: true
            }
        });
    }

    async findByNodeId(nodeId) {
        return prisma.nodePayment.findMany({
            where: {
                nodeId
            },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async create(paymentData, tx = prisma) {
        return tx.nodePayment.create({
            data: {
                ...paymentData,
                createdAt: new Date()
            },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: true
            }
        });
    }

    async update(id, paymentData, tx = prisma) {
        return tx.nodePayment.update({
            where: { id },
            data: paymentData,
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: true
            }
        });
    }

    async updateStatus(id, status, reason = null, tx = prisma) {
        const data = {
            status,
            ...(reason && { reason }),
            processedAt: new Date()
        };

        return tx.nodePayment.update({
            where: { id },
            data,
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: true
            }
        });
    }

    async getTotalPayments(nodeId, { startDate, endDate, type } = {}) {
        const where = {
            nodeId,
            status: 'COMPLETED'
        };

        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        if (type) {
            where.type = type;
        }

        const result = await prisma.nodePayment.aggregate({
            where,
            _sum: {
                amount: true
            }
        });
        return result._sum.amount || 0;
    }

    async getPaymentStats(nodeId) {
        const [pending, completed, failed] = await Promise.all([
            prisma.nodePayment.aggregate({
                where: {
                    nodeId,
                    status: 'PENDING'
                },
                _count: true,
                _sum: {
                    amount: true
                }
            }),
            prisma.nodePayment.aggregate({
                where: {
                    nodeId,
                    status: 'COMPLETED'
                },
                _count: true,
                _sum: {
                    amount: true
                }
            }),
            prisma.nodePayment.aggregate({
                where: {
                    nodeId,
                    status: 'FAILED'
                },
                _count: true,
                _sum: {
                    amount: true
                }
            })
        ]);

        return {
            pending: {
                count: pending._count,
                amount: pending._sum.amount || 0
            },
            completed: {
                count: completed._count,
                amount: completed._sum.amount || 0
            },
            failed: {
                count: failed._count,
                amount: failed._sum.amount || 0
            }
        };
    }

    async findPendingPayments(nodeId) {
        return prisma.nodePayment.findMany({
            where: {
                nodeId,
                status: 'PENDING'
            },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }
}

module.exports = new NodePaymentService();
