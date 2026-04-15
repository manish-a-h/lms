import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function normalizeTeamsGuestEmail(value: string | null | undefined) {
    const email = value?.trim().toLowerCase();
    if (!email) return null;

    const match = /^(.*)#ext#@.*\.onmicrosoft\.com$/i.exec(email);
    if (!match?.[1]) {
        return email;
    }

    const alias = match[1];
    const atIndex = alias.lastIndexOf("_");
    if (atIndex <= 0) {
        return email;
    }

    return `${alias.slice(0, atIndex)}@${alias.slice(atIndex + 1)}`;
}

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("Missing DATABASE_URL");
    }

    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
    });

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: "#ext#", mode: "insensitive" } },
                { nitteEmail: { contains: "#ext#", mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            email: true,
            nitteEmail: true,
            name: true,
        },
    });

    if (users.length === 0) {
        console.log("No guest-format Teams emails found.");
        await prisma.$disconnect();
        return;
    }

    for (const user of users) {
        const normalizedEmail = normalizeTeamsGuestEmail(user.email) || normalizeTeamsGuestEmail(user.nitteEmail);
        if (!normalizedEmail) {
            continue;
        }

        const conflict = await prisma.user.findFirst({
            where: {
                email: normalizedEmail,
                id: { not: user.id },
            },
            select: { id: true },
        });

        if (conflict) {
            console.log(`Skipped ${user.name} because ${normalizedEmail} is already used by another account.`);
            continue;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: normalizedEmail,
                nitteEmail: null,
            },
        });

        console.log(`Updated ${user.name}: ${user.email} -> ${normalizedEmail}`);
    }

    await prisma.$disconnect();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
