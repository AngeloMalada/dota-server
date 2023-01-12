"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express_1 = require("express");
var axios_1 = require("axios");
var cors_1 = require("cors");
var client_1 = require("@prisma/client");
var data_js_1 = require("./data.js");
var prisma = new client_1.PrismaClient();
var app = (0, express_1["default"])();
app.use(express_1["default"].json());
app.use((0, cors_1["default"])());
var fillDB = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, axios_1["default"].get('https://api.opendota.com/api/heroes')];
            case 1:
                data = (_a.sent()).data;
                data.forEach(function (hero) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, prisma.hero.create({
                                    data: {
                                        hero_id: hero.id,
                                        name: hero.name,
                                        localized_name: hero.localized_name,
                                        image_url: "http://cdn.dota2.com/apps/dota2/images/heroes/".concat(hero.name.replace('npc_dota_hero_', ''), "_lg.png")
                                    }
                                })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); };
function getAllHeroImages() {
    return __awaiter(this, void 0, void 0, function () {
        var heroes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.hero.findMany()];
                case 1:
                    heroes = _a.sent();
                    return [2 /*return*/, heroes];
            }
        });
    });
}
function getPlayerData(id) {
    return __awaiter(this, void 0, void 0, function () {
        var Player;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1["default"].get("https://api.opendota.com/api/players/".concat(id, "/heroes"))];
                case 1:
                    Player = _a.sent();
                    return [2 /*return*/, Player.data];
            }
        });
    });
}
function getPlayerName(id) {
    return __awaiter(this, void 0, void 0, function () {
        var Player;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1["default"].get("https://api.opendota.com/api/players/".concat(id))];
                case 1:
                    Player = _a.sent();
                    return [2 /*return*/, Player.data.profile.personaname];
            }
        });
    });
}
//fill db with all heroes
app.post('/fillDB', function (req, res) {
    fillDB()
        .then(function () {
        res.send('done');
    })["catch"](function (err) {
        res.send(err);
    });
});
app.get('/player', function (req, res) {
    var id = req.query.id;
    getPlayerName(Number(id)).then(function (playerName) {
        getAllHeroImages().then(function (heroes) {
            getPlayerData(Number(id)).then(function (playerData) {
                var playerHeroes = playerData.map(function (hero) {
                    var _a, _b, _c, _d, _e;
                    var heroImage = heroes.find(function (heroImage) { return heroImage.hero_id === Number(hero.hero_id); });
                    var role = (_a = data_js_1["default"].find(function (heroData) { return heroData.id === Number(hero.hero_id); })) === null || _a === void 0 ? void 0 : _a.roles;
                    var proWinrate = (_b = data_js_1["default"].find(function (herodata) { return herodata.id === Number(hero.hero_id); })) === null || _b === void 0 ? void 0 : _b.pro_win;
                    var proPickrate = (_c = data_js_1["default"].find(function (herodata) { return herodata.id === Number(hero.hero_id); })) === null || _c === void 0 ? void 0 : _c.pro_pick;
                    var proBanrate = (_d = data_js_1["default"].find(function (herodata) { return herodata.id === Number(hero.hero_id); })) === null || _d === void 0 ? void 0 : _d.pro_ban;
                    var name = (_e = data_js_1["default"].find(function (herodata) { return herodata.id === Number(hero.hero_id); })) === null || _e === void 0 ? void 0 : _e.localized_name;
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
                        image_url: heroImage === null || heroImage === void 0 ? void 0 : heroImage.image_url,
                        proWinrate: ((proWinrate * 100) / proPickrate).toFixed(2),
                        name: name,
                        withWin: hero.with_win,
                        withGames: hero.with_games,
                        playerName: playerName
                    };
                });
                res.send(playerHeroes);
            });
        });
    });
});
//get a single hero
app.get('/hero', function (req, res) {
    var heroId = req.body.heroId;
    prisma.hero
        .findUnique({
        where: {
            hero_id: Number(heroId)
        }
    })
        .then(function (hero) {
        res.send(hero);
    })["catch"](function (err) {
        res.send(err);
    });
});
app.get('/heroes', function (req, res) {
    prisma.hero
        .findMany()
        .then(function (heroes) {
        res.send(heroes);
    })["catch"](function (err) {
        res.send(err);
    });
});
app.listen(8080, function () {
    console.log('Server is running on port 8080');
});
