"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const data_js_1 = __importDefault(require("../utils/data.js"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
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
async function getAllHeroImages() {
    //get all hero images from db
    const heroes = await prisma.hero.findMany();
    return heroes;
}
async function getPlayerData(id) {
    const Player = await axios_1.default.get(`https://api.opendota.com/api/players/${id}/heroes`);
    return Player.data;
}
async function getPlayerName(id) {
    const Player = await axios_1.default.get(`https://api.opendota.com/api/players/${id}`);
    return Player.data.profile.personaname;
}
//fill db with all heroes
app.post('/fillDB', (req, res) => {
    fillDB()
        .then(() => {
        res.send('done');
    })
        .catch((err) => {
        res.send(err);
    });
});
app.get('/player', (req, res) => {
    const { id } = req.query;
    getPlayerName(Number(id)).then((playerName) => {
        getAllHeroImages().then((heroes) => {
            getPlayerData(Number(id)).then((playerData) => {
                const playerHeroes = playerData.map((hero) => {
                    const heroImage = heroes.find((heroImage) => heroImage.hero_id === Number(hero.hero_id));
                    const role = data_js_1.default.find((heroData) => heroData.id === Number(hero.hero_id))?.roles;
                    const proWinrate = data_js_1.default.find((herodata) => herodata.id === Number(hero.hero_id))?.pro_win;
                    const proPickrate = data_js_1.default.find((herodata) => herodata.id === Number(hero.hero_id))?.pro_pick;
                    const proBanrate = data_js_1.default.find((herodata) => herodata.id === Number(hero.hero_id))?.pro_ban;
                    const name = data_js_1.default.find((herodata) => herodata.id === Number(hero.hero_id))?.localized_name;
                    return {
                        id: Number(hero.hero_id),
                        games: hero.games,
                        win: hero.win,
                        heroRoles: role,
                        winPercentage: hero.games > 0
                            ? Number((hero.win * 100) / hero.games).toFixed(2)
                            : 'No games played',
                        winrateAtPlayerLevel: hero.with_games > 0
                            ? Number((hero.with_win * 100) / hero.with_games).toFixed(2)
                            : 1,
                        winrateAgainstPlayer: hero.against_games > 0
                            ? Number(100 - (hero.against_win * 100) / hero.against_games).toFixed(2)
                            : 1,
                        image_url: heroImage?.image_url,
                        proWinrate: ((proWinrate * 100) / proPickrate).toFixed(2),
                        name: name,
                        withWin: hero.with_win,
                        withGames: hero.with_games,
                        playerName: playerName,
                    };
                });
                res.send(playerHeroes);
            });
        });
    });
});
//get a single hero
app.get('/hero', (req, res) => {
    const { heroId } = req.body;
    prisma.hero
        .findUnique({
        where: {
            hero_id: Number(heroId),
        },
    })
        .then((hero) => {
        res.send(hero);
    })
        .catch((err) => {
        res.send(err);
    });
});
app.get('/heroes', (req, res) => {
    prisma.hero
        .findMany()
        .then((heroes) => {
        res.send(heroes);
    })
        .catch((err) => {
        res.send(err);
    });
});
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
//# sourceMappingURL=index.js.map