const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NodePackageService {
    async findAll() {
        return prisma.nodePackage.findMany({
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return prisma.nodePackage.findUnique({
            where: { id },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true
            }
        });
    }

    async findByNodeId(nodeId) {
        return prisma.nodePackage.findUnique({
            where: { nodeId },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true
            }
        });
    }

    async create(nodePackageData) {
        return prisma.nodePackage.create({
            data: nodePackageData,
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true
            }
        });
    }

    async update(id, nodePackageData) {
        return prisma.nodePackage.update({
            where: { id },
            data: nodePackageData,
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true
            }
        });
    }

    async updateStatus(id, status) {
        return prisma.nodePackage.update({
            where: { id },
            data: { status },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true
            }
        });
    }

    async delete(id) {
        return prisma.nodePackage.delete({
            where: { id }
        });
    }

    async findActivePackagesByNodeId(nodeId) {
        return prisma.nodePackage.findMany({
            where: {
                nodeId,
                status: 'ACTIVE'
            },
            include: {
                package: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findByPackageId(packageId) {
        return prisma.nodePackage.findMany({
            where: { packageId },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findUpgradeHistory(nodeId) {
        return prisma.nodePackage.findMany({
            where: {
                nodeId,
                isUpgrade: true
            },
            include: {
                package: true,
                previousPackage: {
                    include: {
                        package: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async createUpgrade(nodeId, packageId, previousPackageId, paymentData) {
        // First deactivate the previous package
        await prisma.nodePackage.update({
            where: { id: previousPackageId },
            data: { status: 'UPGRADED' }
        });

        // Create new package record as upgrade
        return prisma.nodePackage.create({
            data: {
                nodeId,
                packageId,
                status: 'PENDING',
                isUpgrade: true,
                previousPackageId,
                paymentMethod: paymentData.paymentMethod,
                paymentPhone: paymentData.phoneNumber
            },
            include: {
                node: {
                    include: {
                        user: true
                    }
                },
                package: true,
                previousPackage: {
                    include: {
                        package: true
                    }
                }
            }
        });
    }
}

module.exports = new NodePackageService();
