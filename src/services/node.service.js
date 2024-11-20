const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NodeService {
    async findById(id) {
        return prisma.node.findUnique({
            where: { id },
            include: {
                user: true,
                sponsor: true,
                sponsored: true,
                parent: true,
                children: true,
                package: {
                    include: {
                        package: true
                    }
                },
                payments: true,
                statements: true,
                withdrawals: true
            }
        });
    }

    async findByUserId(userId) {
        return prisma.node.findUnique({
            where: { userId },
            include: {
                user: true,
                sponsor: true,
                sponsored: true,
                parent: true,
                children: true,
                package: {
                    include: {
                        package: true
                    }
                }
            }
        });
    }

    async create(nodeData) {
        return prisma.node.create({
            data: nodeData,
            include: {
                user: true,
                sponsor: true,
                parent: true
            }
        });
    }

    async update(id, nodeData) {
        return prisma.node.update({
            where: { id },
            data: nodeData,
            include: {
                user: true,
                sponsor: true,
                parent: true
            }
        });
    }

    async getDownline(id, levels = 1) {
        const node = await prisma.node.findUnique({
            where: { id },
            include: {
                sponsored: {
                    include: {
                        user: true,
                        package: {
                            include: {
                                package: true
                            }
                        }
                    }
                }
            }
        });

        if (!node) return null;

        if (levels === 1) {
            return node.sponsored;
        }

        const downline = [...node.sponsored];
        for (const sponsoredNode of node.sponsored) {
            const subDownline = await this.getDownline(sponsoredNode.id, levels - 1);
            if (subDownline) {
                downline.push(...subDownline);
            }
        }

        return downline;
    }

    async getBinaryTree(id) {
        return prisma.node.findUnique({
            where: { id },
            include: {
                children: {
                    include: {
                        user: true,
                        package: {
                            include: {
                                package: true
                            }
                        },
                        children: {
                            include: {
                                user: true,
                                package: {
                                    include: {
                                        package: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async findPlacementPosition(sponsorId) {
        const sponsor = await this.getBinaryTree(sponsorId);
        if (!sponsor) return null;

        const queue = [sponsor];
        while (queue.length > 0) {
            const current = queue.shift();
            const leftChild = current.children.find(child => child.position === 'LEFT');
            const rightChild = current.children.find(child => child.position === 'RIGHT');

            if (!leftChild) {
                return { parentId: current.id, position: 'LEFT' };
            }
            if (!rightChild) {
                return { parentId: current.id, position: 'RIGHT' };
            }

            queue.push(...current.children);
        }

        return null;
    }
}

module.exports = new NodeService();
