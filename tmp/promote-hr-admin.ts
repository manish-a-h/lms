import "dotenv/config";
import { Role } from "../src/generated/prisma/client";
import { db } from "../src/lib/db";

async function main() {
    const email = "sujalmh9@gmail.com";

    const user = await db.user.findFirst({
        where: {
            OR: [
                { email },
                { nitteEmail: email },
            ],
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            department: true,
            designation: true,
        },
    });

    if (!user) {
        throw new Error(`No user found for ${email}`);
    }

    const updated = await db.user.update({
        where: { id: user.id },
        data: {
            email,
            nitteEmail: null,
            role: Role.hr_admin,
            isActive: true,
            department: "Human Resources",
            designation: "HR Admin",
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            department: true,
            designation: true,
        },
    });

    await db.approvedEmail.upsert({
        where: { email },
        update: {
            role: Role.hr_admin,
            isActive: true,
        },
        create: {
            email,
            role: Role.hr_admin,
            isActive: true,
        },
    });

    console.log(JSON.stringify(updated, null, 2));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.$disconnect();
    });
