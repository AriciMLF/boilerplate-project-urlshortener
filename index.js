require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');
const { url } = require('inspector');

const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlshortener");
const urls = db.collection("urls");


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log(req.body);
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname,
    async (err, address) => {
      if (!address){
        res.json({ error: "Invalid URL" });
      } else{

        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url: url,
          shortUrl: urlCount
        }

        const result = await urls.insertOne(urlDoc);
        console.log(result);
        res.json({ original_url: url, short_url: urlCount });
      }
    })
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  
  try {
    // Find the document with the matching short_url
    const urlDoc = await urls.findOne({ shortUrl: +shorturl });

    // If no document was found, send an error response
    if (!urlDoc) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // If found, redirect to the original URL
    res.redirect(urlDoc.url);
  } catch (error) {
    // Handle any unexpected errors (e.g., database connection issues)
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
