const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    aliases: ["music", "play"],
    version: "2.5",
    author: "Farhan",
    countDown: 3,
    role: 0,
    shortDescription: "Play a song from YouTube (auto selects most viewed)",
    longDescription:
      "Search for a song from YouTube, auto-selects the most viewed result, and sends high-quality audio.",
    category: "media",
    guide: {
      en: "{pn} <song name>"
    }
  },

  onStart: async function ({ message, args, api, event }) {
    const query = args.join(" ").trim();
    if (!query)
      return message.reply("❌ | Please provide a song name.\nExample: sing Starboy");

    let msg;
    try {
      msg = await message.reply(`🎵 Searching for **${query}**...`);

      // ✅ NEW Powerful YouTube Music Search API
      const searchUrl = `https://api.kenliejugarap.com/youtube/search?query=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl);
      const results = searchRes.data?.data;

      if (!Array.isArray(results) || results.length === 0)
        return message.edit("❌ | No results found on YouTube.");

      // Choose most viewed
      const best = results.sort((a, b) => (b.views || 0) - (a.views || 0))[0];

      // ✅ Use a faster, reliable converter
      const downloadApi = `https://api.kenliejugarap.com/youtube/download?url=${encodeURIComponent(best.url)}&type=mp3`;
      const downRes = await axios.get(downloadApi);
      const dlUrl = downRes.data?.downloadUrl;

      if (!dlUrl) return message.edit("❌ | Failed to fetch download link.");

      await message.edit("⬇️ | Downloading high-quality audio...");

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `sing_${Date.now()}.mp3`);

      const audioRes = await axios.get(dlUrl, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(audioRes.data));

      const info = `🎶 | ${best.title}\n👤 Artist: ${best.channel}\n👁️ Views: ${best.views.toLocaleString()}`;

      await message.reply({
        body: info,
        attachment: fs.createReadStream(filePath)
      });

      await fs.unlink(filePath).catch(() => {});
      await api.unsendMessage(msg.messageID);

    } catch (err) {
      console.error("[sing command error]", err);
      if (msg?.messageID)
        message.edit("❌ | An error occurred while processing your request.");
      else
        message.reply("❌ | Something went wrong, please try again later.");
    }
  }
};
