const express = require('express');
const firebaseAdmin = require('firebase-admin');

const server = express();

server.use(express.urlencoded({ extended: true }));
server.use(express.json());

const serviceAccount = require('./citrus-20-69a173551ecf.json');
const credentials = { credential: firebaseAdmin.credential.cert(serviceAccount) };
firebaseAdmin.initializeApp(credentials);
const db = firebaseAdmin.firestore();

server.get('/user/:id', async (req, res, next) => {
  try {
    const doc = await db.collection('Users').doc(req.params.id).get();
    if (!doc.exists) return res.json({error: 'No such user exists'});
    const user = doc.data();
    res.json({user});
  } catch (err) {
    console.error(err);
  }
});

server.get('/ways', async (req, res, next) => {
  try {
    const snapshot = await db.collection('Ways').get();
    const ways = snapshot.docs.map((doc) => {
      const d = doc.data();
      d.id = doc.id;
      return d;
    });
    res.json({ways});
  } catch (err) {
    console.error(err);
  }
});

server.get('/leaderboard', async (req, res, next) => {
  try {
    const snapshot = await db.collection('Users').get();
    const leaderboard = snapshot.docs.map((doc) => {
      const {name, points} = doc.data();
      return {name, points};
    });
    res.json({leaderboard});
  } catch (err) {
    console.error(err);
  }
});

// only allow once a day per way
server.post('/user/attendance', async (req, res, next) => {
  try {
    const way = await db.collection('Ways').doc(req.body.way).get().then((doc) => doc.data());
    const user = await db.collection('Users').doc(req.body.user).get().then((doc) => doc.data());
    user.ways[req.body.way].completed.push(Date.now())
    user.ways[req.body.way].currentStreak = parseInt(user.ways[req.body.way].currentStreak, 10) + 1;
    user.points.week[6] = parseInt(user.points.week[6], 10) + parseInt(way.pointValue, 10);
    user.points.month[29] = parseInt(user.points.month[29], 10) + parseInt(way.pointValue, 10);
    user.points.alltime = parseInt(user.points.alltime, 10) + parseInt(way.pointValue, 10);
    await db.collection('Users').doc(req.body.user).update(user);
    res.json({error: null});
  } catch (err) {
    console.error(err);
  }
});

server.post('/user', async (req, res, next) => {
  const points = {
    week: new Array(7).fill(0),
    month: new Array(30).fill(0),
    alltime: 0,
  };
  const way = {
    completed: [],
    currentStreak: 0,
  };
  const user = { name: req.body.name, ways: {}, points };
  try {
    const way_ids = await db.collection('Ways').get().then((snapshot) => snapshot.docs.map((doc) => doc.id));
    for (let i = 0; i < way_ids.length; i += 1) {
      user.ways[way_ids[i]] = way;
    }
    const id = await db.collection('Users').add(user).then((doc) => doc.id);
    res.json({id});
  } catch (err) {
    console.error(err);
  }
});

const port = 8000;
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
