"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const landmarks = [
        { name: 'Accra Mall', latitude: 5.6201, longitude: -0.1737 },
        { name: 'Adenta Barrier', latitude: 5.7072, longitude: -0.1601 },
        { name: 'Ridge (Central Business District)', latitude: 5.5566, longitude: -0.2012 },
        { name: 'Tetteh Quarshie Interchange', latitude: 5.6133, longitude: -0.1834 },
        { name: 'Atomic Junction', latitude: 5.6667, longitude: -0.1833 },
        { name: 'Circle (Obetsebi Lamptey)', latitude: 5.5587, longitude: -0.2132 },
        { name: 'Achimota Mall', latitude: 5.6367, longitude: -0.2317 },
        { name: 'Spintex (Papaye)', latitude: 5.6212, longitude: -0.1245 },
        { name: 'Kasoa Galleria', latitude: 5.5333, longitude: -0.4167 },
        { name: 'Dansoman (Keep Fit)', latitude: 5.5500, longitude: -0.2667 },
    ];
    console.log('Seeding landmarks...');
    for (const landmark of landmarks) {
        await prisma.landmark.upsert({
            where: { name: landmark.name },
            update: {},
            create: landmark,
        });
    }
    console.log('Seeding completed.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map