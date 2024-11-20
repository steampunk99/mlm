const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NodeChildrenService {
    async getDownline({ userId, level, status, startDate, endDate }) {
        const where = {
            sponsorId: userId,
            isDeleted: false
        };

        if (status) where.status = status;
        if (startDate) where.createdAt = { gte: startDate };
        if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

        return prisma.node.findMany({
            where,
            include: {
                package: true,
                rank: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getUpline({ userId, level }) {
        const genealogy = [];
        let currentNode = await prisma.node.findUnique({
            where: { id: userId },
            include: {
                parent: true
            }
        });

        while (currentNode?.parent && (!level || genealogy.length < level)) {
            genealogy.push(currentNode.parent);
            currentNode = await prisma.node.findUnique({
                where: { id: currentNode.parent.id },
                include: {
                    parent: true
                }
            });
        }

        return genealogy;
    }

    async getNetworkStats(userId) {
        const [directReferrals, leftTeam, rightTeam] = await Promise.all([
            prisma.node.count({
                where: {
                    sponsorId: userId,
                    isDeleted: false
                }
            }),
            this.getTeamCount(userId, 'L'),
            this.getTeamCount(userId, 'R')
        ]);

        return {
            directReferrals,
            leftTeam,
            rightTeam,
            totalTeam: leftTeam.total + rightTeam.total
        };
    }

    async getTeamCount(userId, direction) {
        const [total, active] = await Promise.all([
            prisma.node.count({
                where: {
                    parentId: userId,
                    direction,
                    isDeleted: false
                }
            }),
            prisma.node.count({
                where: {
                    parentId: userId,
                    direction,
                    status: 'ACTIVE',
                    isDeleted: false
                }
            })
        ]);

        return { total, active };
    }

    async getTeamPerformance({ userId, startDate, endDate }) {
        const where = {
            OR: [
                { parentId: userId },
                { sponsorId: userId }
            ],
            isDeleted: false
        };

        if (startDate) where.createdAt = { gte: startDate };
        if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

        const performance = await prisma.node.findMany({
            where,
            include: {
                package: true,
                transactions: {
                    where: {
                        type: 'COMMISSION',
                        status: 'COMPLETED',
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                }
            }
        });

        return performance.map(member => ({
            ...member,
            totalCommission: member.transactions.reduce((sum, tx) => sum + tx.amount, 0)
        }));
    }

    async getGenealogyTree({ userId, depth = 3 }) {
        const getChildren = async (nodeId, currentDepth) => {
            if (currentDepth >= depth) return null;

            const children = await prisma.node.findMany({
                where: {
                    parentId: nodeId,
                    isDeleted: false
                },
                include: {
                    package: true,
                    rank: true
                }
            });

            const childrenWithSubtrees = await Promise.all(
                children.map(async child => ({
                    ...child,
                    children: await getChildren(child.id, currentDepth + 1)
                }))
            );

            return {
                left: childrenWithSubtrees.find(child => child.direction === 'L') || null,
                right: childrenWithSubtrees.find(child => child.direction === 'R') || null
            };
        };

        const root = await prisma.node.findUnique({
            where: { id: userId },
            include: {
                package: true,
                rank: true
            }
        });

        return {
            ...root,
            children: await getChildren(userId, 0)
        };
    }

    async getDirectReferrals({ userId, status, startDate, endDate, page = 1, limit = 10 }) {
        const where = {
            sponsorId: userId,
            isDeleted: false
        };

        if (status) where.status = status;
        if (startDate) where.createdAt = { gte: startDate };
        if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

        const [total, referrals] = await Promise.all([
            prisma.node.count({ where }),
            prisma.node.findMany({
                where,
                include: {
                    package: true,
                    rank: true
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ]);

        return {
            data: referrals,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getBusinessVolume({ userId, startDate, endDate }) {
        const where = {
            OR: [
                { parentId: userId },
                { sponsorId: userId }
            ],
            isDeleted: false
        };

        if (startDate) where.createdAt = { gte: startDate };
        if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

        const [personalVolume, groupVolume] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    userId,
                    type: 'PURCHASE',
                    status: 'COMPLETED',
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _sum: {
                    amount: true
                }
            }),
            prisma.transaction.aggregate({
                where: {
                    user: {
                        OR: [
                            { parentId: userId },
                            { sponsorId: userId }
                        ]
                    },
                    type: 'PURCHASE',
                    status: 'COMPLETED',
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _sum: {
                    amount: true
                }
            })
        ]);

        return {
            personalVolume: personalVolume._sum.amount || 0,
            groupVolume: groupVolume._sum.amount || 0,
            totalVolume: (personalVolume._sum.amount || 0) + (groupVolume._sum.amount || 0)
        };
    }

    async getRankQualification(userId) {
        const user = await prisma.node.findUnique({
            where: { id: userId },
            include: {
                rank: true,
                package: true
            }
        });

        const nextRank = await prisma.rank.findFirst({
            where: {
                level: {
                    gt: user.rank.level
                }
            },
            orderBy: {
                level: 'asc'
            }
        });

        if (!nextRank) {
            return {
                currentRank: user.rank,
                nextRank: null,
                requirements: null,
                progress: null
            };
        }

        const [directReferrals, teamVolume] = await Promise.all([
            prisma.node.count({
                where: {
                    sponsorId: userId,
                    isDeleted: false,
                    status: 'ACTIVE'
                }
            }),
            this.getBusinessVolume({
                userId,
                startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
            })
        ]);

        const requirements = {
            directReferrals: {
                required: nextRank.requiredDirectReferrals,
                current: directReferrals
            },
            teamVolume: {
                required: nextRank.requiredTeamVolume,
                current: teamVolume.totalVolume
            }
        };

        const progress = {
            directReferrals: (directReferrals / nextRank.requiredDirectReferrals) * 100,
            teamVolume: (teamVolume.totalVolume / nextRank.requiredTeamVolume) * 100
        };

        return {
            currentRank: user.rank,
            nextRank,
            requirements,
            progress
        };
    }

    async getTeamStructure({ userId, view }) {
        const getStructure = async (nodeId, structure) => {
            const node = await prisma.node.findUnique({
                where: { id: nodeId },
                include: {
                    package: true,
                    rank: true
                }
            });

            if (!node) return null;

            const children = await prisma.node.findMany({
                where: {
                    [structure === 'binary' ? 'parentId' : 'sponsorId']: nodeId,
                    isDeleted: false
                },
                include: {
                    package: true,
                    rank: true
                }
            });

            return {
                ...node,
                children: await Promise.all(
                    children.map(child => getStructure(child.id, structure))
                )
            };
        };

        return getStructure(userId, view);
    }

    async searchNetwork({ userId, query, type }) {
        const where = {
            OR: [
                { parentId: userId },
                { sponsorId: userId }
            ],
            isDeleted: false
        };

        if (type === 'username') {
            where.OR.push({ username: { contains: query } });
        } else if (type === 'email') {
            where.OR.push({ email: { contains: query } });
        }

        return prisma.node.findMany({
            where,
            include: {
                package: true,
                rank: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
}

module.exports = new NodeChildrenService();
