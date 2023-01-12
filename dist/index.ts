import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

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

const getPlayerData = async () => {
  const { data } = await axios.get(
    'https://api.opendota.com/api/players/72407726/heroes',
  );
  return data;
};

app.get('/player', async (req, res) => {
  const playerData = await getPlayerData();
  res.send(playerData);
});

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
