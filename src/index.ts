import express, { application } from 'express';
import axios from 'axios';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import HeroDataStratz from '../utils/data.js';

type playerHero = {
  hero_id: number;
  games: any;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
  winPercentage: number;
  losePercentage: number;
  image_url: string;
  role: string;
};

type Player = {
  data: playerHero[];
};

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors());

const fillDB = async () => {
  const { data } = await axios.get('https://api.opendota.com/api/heroes');
  data.forEach(async (hero: any) => {
    await prisma.hero.create({
      data: {
        hero_id: hero.id,
        name: hero.name,
        localized_name: hero.localized_name,
        image_url: `http://cdn.dota2.com/apps/dota2/images/heroes/${hero.name.replace(
          'npc_dota_hero_',
          '',
        )}_lg.png`,
      },
    });
  });
};

async function getAllHeroImages() {
  //get all hero images from db

  const heroes = await prisma.hero.findMany();
  return heroes;
}

async function getPlayerData(id: number) {
  const Player: Player = await axios.get(
    `https://api.opendota.com/api/players/${id}/heroes`,
  );

  return Player.data;
}
async function getPlayerName(id: number) {
  const Player = await axios.get(`https://api.opendota.com/api/players/${id}`);
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
        const playerHeroes = playerData.map((hero: playerHero) => {
          const heroImage = heroes.find(
            (heroImage) => heroImage.hero_id === Number(hero.hero_id),
          );

          const role = HeroDataStratz.find(
            (heroData) => heroData.id === Number(hero.hero_id),
          )?.roles;
          const proWinrate = HeroDataStratz.find(
            (herodata) => herodata.id === Number(hero.hero_id),
          )?.pro_win;
          const proPickrate = HeroDataStratz.find(
            (herodata) => herodata.id === Number(hero.hero_id),
          )?.pro_pick;
          const proBanrate = HeroDataStratz.find(
            (herodata) => herodata.id === Number(hero.hero_id),
          )?.pro_ban;
          const name = HeroDataStratz.find(
            (herodata) => herodata.id === Number(hero.hero_id),
          )?.localized_name;

          return {
            id: Number(hero.hero_id),
            games: hero.games,
            win: hero.win,
            heroRoles: role,
            winPercentage:
              hero.games > 0
                ? Number((hero.win * 100) / hero.games).toFixed(2)
                : 'No games played',
            winrateAtPlayerLevel:
              hero.with_games > 0
                ? Number((hero.with_win * 100) / hero.with_games).toFixed(2)
                : 1,
            winrateAgainstPlayer:
              hero.against_games > 0
                ? Number(
                    100 - (hero.against_win * 100) / hero.against_games,
                  ).toFixed(2)
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
