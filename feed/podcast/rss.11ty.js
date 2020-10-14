const Podcast = require("podcast");

class PodcastFeed {
  data() {
    return {
      permalink: "feed/podcast/rss.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const podcast = this.genPodcast(data.podcast, data.collections.podcasts);
    return podcast;
  }

  genPodcast(podcastData, episodes) {
    const podcast = new Podcast(podcastData);
    let orderedEpisodes = [...episodes];
    orderedEpisodes.reverse();
    orderedEpisodes
      .filter((episode) => episode.data.isPublished)
      .forEach((episode) => {
        podcast.addItem(renderEpisode(podcastData, episode));
      });

    return podcast.buildXml();
  }
}

const renderEpisode = (podcast, episode) => {
  return {
    title: episode.data.title,
    description: episode.templateContent,
    url: episode.data.permalink,
    categories: episode.data.categories,
    author: podcast.author,
    date: episode.date,
    enclosure: { url: episode.data.fileUrl, size: episode.data.fileSize },
    itunesAuthor: podcast.author,
    itunesExplicit: episode.data.isExplicit === true,
    itunesSubtitle: episode.data.subtitle,
    itunesEpisode: episode.data.episode,
    itunesSummary: episode.data.summary,
    itunesDuration: episode.data.durationSeconds,
    itunesNewFeedUrl: podcast.feedUrl,
  };
};

/*
    tags: ['podcasts']
    title:  DreamClients - Intro To The Podcast
    permalink: https://www.dreamclients.io/podcasts/000_intro/
    categories: ['freelancing']
    date: October 13 2020
    fileUrl: https://dreamclients-podcast.s3.eu-west-3.amazonaws.com/podcast/episodes/episode-1-Podcast-Intro.mp3
    isExplicit: false
    itunesAuthor: Aaron Cruz
    itunesExplicit: false
    itunesSubtitle: An intro to the DreamClients podcast
    itunesDuration: 188


    title:  'item title',
    description: 'use this for the content. It can include html.',
    url: 'http://example.com/article4?this&that', // link to the item
    guid: '1123', // optional - defaults to url
    categories: ['Category 1','Category 2','Category 3','Category 4'], // optional - array of item categories
    author: 'Guest Author', // optional - defaults to feed author property
    date: 'May 27, 2012', // any format that js Date can parse.
    lat: 33.417974, //optional latitude field for GeoRSS
    long: -111.933231, //optional longitude field for GeoRSS
    enclosure : {url:'...', file:'path-to-file'}, // optional enclosure
    itunesAuthor: 'Max Nowack',
    itunesExplicit: false,
    itunesSubtitle: 'I am a sub title',
    itunesSummary: 'I am a summary',
    itunesDuration: 12345,
    itunesNewFeedUrl: 'https://newlocation.com/example.rss',
*/

module.exports = PodcastFeed;
