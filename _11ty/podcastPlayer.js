const { DateTime, Duration } = require("luxon");

module.exports = (podcast) => {
  const id = `episode_${podcast.fileSlug}`;
  const payload = {
    show: {
      title: "DreamClients Podcast",
      poster:
        "https://dreamclients-podcast.s3.eu-west-3.amazonaws.com/podcast/images/dreamclients-podcast-logo-square-1%406x.png",
    },
    duration: timeStamp(podcast.data.durationSeconds),
    title: podcast.data.title,
    subtitle: podcast.data.subtitle,
    summary: podcast.data.summary,
    audio: [
      {
        url: podcast.data.fileUrl,
        size: podcast.data.fileSize,
        title: "MP3 Audio (mp3)",
        mimeType: "audio/mpeg",
      },
    ],
  };

  const serialized = JSON.stringify(payload);

  const template = `
    <div id="${id}" data-variant="m"></div>

    <script>
        window.podlovePlayer("#${id}", ${serialized});
    </script>
  `;

  return template;
};

const timeStamp = (seconds) => {
  return Duration.fromObject({ seconds }).toFormat("hh:mm:ss");
};
