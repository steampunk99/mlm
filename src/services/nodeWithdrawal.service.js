const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NodeWithdrawalService {
    async findAll(nodeId, { status } = {}) {
        const where = { nodeId };

        if (status) {
            where.status = status;
        }

        return prisma.nodeWithdrawal.findMany({
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
        return prisma.nodeWithdrawal.findUnique({
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

    async create(withdrawalData) {
        return prisma.nodeWithdrawal.create({
            data: {
                ...withdrawalData,
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

    async update(id, withdrawalData) {
        return prisma.nodeWithdrawal.update({
            where: { id },
            data: withdrawalData,
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
        return prisma.nodeWithdrawal.delete({
            where: { id }
        });
    }

    async updateStatus(id, status, reason = null) {
        const updateData = {
            status,
            processedAt: new Date(),
            ...(reason && { reason })
        };

        return prisma.nodeWithdrawal.update({
            where: { id },
            data: updateData,
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
        return prisma.nodeWithdrawal.findMany({
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

    async getTotalWithdrawnAmount(nodeId) {
        const result = await prisma.nodeWithdrawal.aggregate({
            where: {
                nodeId,
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });
        return result._sum.amount || 0;
    }

    async getWithdrawalStats(nodeId) {
        const [pending, completed, rejected] = await Promise.all([
            prisma.nodeWithdrawal.aggregate({
                where: {
                    nodeId,
                    status: 'PENDING'
                },
                _count: true,
                _sum: {
                    amount: true
                }
            }),
            prisma.nodeWithdrawal.aggregate({
                where: {
                    nodeId,
                    status: 'COMPLETED'
                },
                _count: true,
                _sum: {
                    amount: true
                }
            }),
            prisma.nodeWithdrawal.aggregate({
                where: {
                    nodeId,
                    status: 'REJECTED'
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
            rejected: {
                count: rejected._count,
                amount: rejected._sum.amount || 0
            }
        };
    }
}

module.exports = new NodeWithdrawalService();
