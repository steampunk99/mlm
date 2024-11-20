const { execSync } = require('child_process');
const path = require('path');

// Function to execute git commands
const git = (command) => {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error);
        process.exit(1);
    }
};

// Groups of files to commit together
const commitGroups = [
    {
        message: "chore(deps): Update package dependencies for Prisma migration",
        files: [
            "package.json",
            "package-lock.json"
        ]
    },
    {
        message: "feat(prisma): Add Prisma schema and initial setup",
        files: [
            "prisma/"
        ]
    },
    {
        message: "feat(services): Add service layer for business logic",
        files: [
            "src/services/"
        ]
    },
    {
        message: "feat(lib): Add shared library utilities",
        files: [
            "src/lib/"
        ]
    },
    {
        message: "refactor(controllers): Update admin and auth controllers for Prisma",
        files: [
            "src/controllers/admin.controller.js",
            "src/controllers/auth.controller.js"
        ]
    },
    {
        message: "refactor(controllers): Update financial controllers for Prisma",
        files: [
            "src/controllers/finance.controller.js",
            "src/controllers/payment.controller.js",
            "src/controllers/withdrawal.controller.js"
        ]
    },
    {
        message: "refactor(controllers): Update network and package controllers for Prisma",
        files: [
            "src/controllers/network.controller.js",
            "src/controllers/package.controller.js"
        ]
    },
    {
        message: "refactor(controllers): Update notification and announcement controllers for Prisma",
        files: [
            "src/controllers/notification.controller.js",
            "src/controllers/announcement.controller.js"
        ]
    },
    {
        message: "refactor(controllers): Update report controller for Prisma",
        files: [
            "src/controllers/report.controller.js"
        ]
    },
    {
        message: "refactor(routes): Update admin and auth routes with validation",
        files: [
            "src/routes/admin.routes.js",
            "src/routes/auth.routes.js",
            "src/routes/auth.js"
        ]
    },
    {
        message: "refactor(routes): Update network and notification routes with validation",
        files: [
            "src/routes/network.routes.js",
            "src/routes/notification.routes.js"
        ]
    },
    {
        message: "refactor(routes): Update announcement and report routes with validation",
        files: [
            "src/routes/announcement.routes.js",
            "src/routes/report.routes.js"
        ]
    },
    {
        message: "refactor(models): Remove Node and related Sequelize models",
        files: [
            "src/models/Node.js",
            "src/models/NodeChildren.js",
            "src/models/NodePackage.js",
            "src/models/NodePayment.js",
            "src/models/NodeStatement.js",
            "src/models/NodeWithdrawal.js",
            "src/models/Package.js"
        ]
    },
    {
        message: "refactor(models): Remove business Sequelize models",
        files: [
            "src/models/commission.model.js",
            "src/models/notification.model.js",
            "src/models/package.model.js",
            "src/models/report.model.js",
            "src/models/withdrawal.model.js",
            "src/models/user.model.js",
            "src/models/index.js"
        ]
    },
    {
        message: "test(cleanup): Remove deprecated model tests",
        files: [
            "src/models/test/announcement.model.js",
            "src/models/test/commission.model.js",
            "src/models/test/index.js",
            "src/models/test/notification.model.js",
            "src/models/test/package.model.js",
            "src/models/test/user.model.js",
            "src/models/test/withdrawal.model.js"
        ]
    },
    {
        message: "chore(scripts): Add git commit grouping script",
        files: [
            "scripts/git-commit-groups.js"
        ]
    }
];

console.log("Starting group commits...");

// Process each group
commitGroups.forEach((group, index) => {
    console.log(`\nProcessing group ${index + 1}/${commitGroups.length}: ${group.message}`);
    
    // Add files in the group
    group.files.forEach(file => {
        try {
            console.log(`Adding: ${file}`);
            git(`git add "${file}"`);
        } catch (error) {
            console.warn(`Warning: Could not add ${file}`);
        }
    });

    // Commit the group
    try {
        git(`git commit -m "${group.message}"`);
        console.log(`Committed: ${group.message}`);
    } catch (error) {
        console.warn(`Warning: No changes to commit for group ${index + 1}`);
    }
});

console.log("\nAll groups processed!");

// Show final git status
console.log("\nFinal git status:");
git("git status");
