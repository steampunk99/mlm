const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PackageService {
    async findAll() {
        return prisma.package.findMany({
            include: {
                nodes: {
                    include: {
                        node: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });
    }

    async findById(id) {
        return prisma.package.findUnique({
            where: { id },
            include: {
                nodes: {
                    include: {
                        node: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });
    }

    async create(packageData) {
        return prisma.package.create({
            data: packageData
        });
    }

    async update(id, packageData) {
        return prisma.package.update({
            where: { id },
            data: packageData
        });
    }

    async delete(id) {
        return prisma.package.delete({
            where: { id }
        });
    }

    async assignToNode(nodeId, packageId) {
        return prisma.nodePackage.create({
            data: {
                nodeId,
                packageId,
                status: 'ACTIVE'
            },
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

    async getNodePackages(nodeId) {
        return prisma.nodePackage.findMany({
            where: {
                nodeId
            },
            include: {
                package: true
            }
        });
    }
}

module.exports = new PackageService();
