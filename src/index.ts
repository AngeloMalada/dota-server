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

const lane = '&lane_role=1&lane_role=2&lane_role=3&lane_role=4';

async function getPlayerData(id: number) {
  const Player: Player = await axios.get(
    `https://api.opendota.com/api/players/${id}/heroes?date=30${lane}`,
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

async function getStratzData(id: number, date: number, gamemode: any,minimumMatches: number) {
  const config = {
    headers: {
      Authorization: `Bearer ${process.env.BEARER}`,
    },
  };

  //0 = unranked 7=ranked 1 = practice

  const heroData = await axios
    .get(
      `https://api.stratz.com/api/v1/Player/${id}/heroPerformance?startDateTime=${date}&lobbyType=${gamemode}`,
      config,
    )
    .catch((err) => {
      return {
        data: [
          {
            messege: 'error',
          },
        ],
      };
    });

  heroData.data = heroData.data.filter((hero: any) => {
    return hero.matchCount > minimumMatches;
  });

  heroData.data.sort((a: any, b: any) => {
    return (
      (Math.pow(b.matchCount, 1.4) * Math.pow(b.winCount / b.matchCount, 1.2) + b.imp*100 ) -
      (Math.pow(a.matchCount, 1.4) * Math.pow(a.winCount / a.matchCount, 1.2) + a.imp*100)
    );
  });

  //if data is empty array return messege otherwise return data

  return heroData.data.length === 0
    ? [
        {
          messege: 'No data',
        },
      ]
    : heroData.data;
}

app.get('/stratz', (req, res) => {
  // const date = Math.floor(new Date().getTime() / 1000.0) - 2592000;
  const { id, date, gamemode , matches} = req.query;
  getPlayerName(Number(id)).then((playerName) => {
    getAllHeroImages().then((heroes) => {
      getStratzData(Number(id), Number(date), gamemode , Number(matches)).then((stratzData) => {
        const playerHeroes = stratzData.map((hero) => {
          const heroImage = heroes.find(
            (heroImage) => heroImage.hero_id === Number(hero.heroId),
          );
          const heroName = HeroDataStratz.find(
            (heroData) => heroData.id === Number(hero.heroId),
          )?.localized_name;
          return {
            playerName: playerName,
            Name: heroName,
            id: Number(hero.heroId),
            imp: hero.imp,
            win: hero.winCount,
            games: hero.matchCount,
            image_url: heroImage?.image_url,
            kda: hero.kda,
            positionScore: hero.positionScore,
            gpm: hero.goldPerMinute,
            xpm: hero.experiencePerMinute,
            messege: hero.messege,
          };
        });
        res.send(playerHeroes);
      });
    });
  });
});
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
