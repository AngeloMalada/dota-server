"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const fillDB = async () => {
    const { data } = await axios_1.default.get('https://api.opendota.com/api/heroes');
    data.forEach(async (hero) => {
        await prisma.hero.create({
            data: {
                hero_id: hero.id,
                name: hero.name,
                localized_name: hero.localized_name,
                image_url: `http://cdn.dota2.com/apps/dota2/images/heroes/${hero.name.replace('npc_dota_hero_', '')}_lg.png`,
            },
        });
    });
};
app.post('/heroes', (req, res) => {
    fillDB()
        .then(() => {
        res.send('done');
    })
        .catch((err) => {
        res.send(err);
    });
});
//# sourceMappingURL=inbex.js.map