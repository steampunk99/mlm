const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NodeStatementService {
    async findAll(nodeId, { startDate, endDate, type } = {}) {
        const where = { nodeId };

        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        if (type === 'credit') {
            where.type = 'CREDIT';
        } else if (type === 'debit') {
            where.type = 'DEBIT';
        }

        return prisma.nodeStatement.findMany({
            where,
            include: {
                node: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return prisma.nodeStatement.findUnique({
            where: { id },
            include: {
                node: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }

    async create(statementData) {
        return prisma.nodeStatement.create({
            data: {
                ...statementData,
                createdAt: new Date()
            },
            include: {
                node: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }

    async update(id, statementData) {
        return prisma.nodeStatement.update({
            where: { id },
            data: statementData,
            include: {
                node: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }

    async delete(id) {
        return prisma.nodeStatement.delete({
            where: { id }
        });
    }

    async getBalance(nodeId) {
        const credits = await prisma.nodeStatement.aggregate({
            where: {
                nodeId,
                type: 'CREDIT',
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });

        const debits = await prisma.nodeStatement.aggregate({
            where: {
                nodeId,
                type: 'DEBIT',
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });

        const totalCredits = credits._sum.amount || 0;
        const totalDebits = debits._sum.amount || 0;
        const currentBalance = totalCredits - totalDebits;

        return {
            currentBalance,
            totalCredits,
            totalDebits
        };
    }

    async findByReferenceId(referenceType, referenceId) {
        return prisma.nodeStatement.findMany({
            where: {
                referenceType,
                referenceId
            },
            include: {
                node: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }

    async updateStatus(id, status) {
        return prisma.nodeStatement.update({
            where: { id },
            data: { status },
            include: {
                node: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }

    async findPendingByNodeId(nodeId) {
        return prisma.nodeStatement.findMany({
            where: {
                nodeId,
                status: 'PENDING'
            },
            include: {
                node: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }
}

module.exports = new NodeStatementService();
