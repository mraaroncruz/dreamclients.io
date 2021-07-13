const axios = require("axios");
const simplecastApiKey = process.env.SIMPLECAST_API_KEY;
axios.defaults.headers.common["Authorization"] = `Bearer ${simplecastApiKey}`;

const podcastId = process.env.SIMPLECAST_PODCAST_ID;

module.exports = async () => {
  try {
    const episodes = await client.episodes();
    console.log(episodes);
    return episodes;
  } catch (e) {
    console.log(e);
  }
};

const client = {
  async episodes() {
    const url = `https://api.simplecast.com/podcasts/${podcastId}/episodes`;
    const res = await axios.get(url);
    return res.data.collection.filter(
      (episode) => episode.status === "published" && !episode.is_hidden
    );
  },

  async episode(episodeId) {
    const url = `https://api.simplecast.com/episodes/${episodeId}`;
    const res = await axios.get(url);
    return res;
  },
};
