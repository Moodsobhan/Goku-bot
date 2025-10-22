const axios = require("axios");
const URL_TTS = "https://api.streamelements.com/kappa/v2/speech";

module.exports = {
  config: {
    name: "say",
    aliases: ["sy", "tts"],
    version: "5.0", // Updated version
    author: "Farhan & Milan (Modified by Gemini)",
    countDown: 1,
    role: 0,
    shortDescription: "Speak text using various voices (anime, celebrity, custom).",
    longDescription: "Text-to-speech using pre-mapped or custom StreamElements voices. Note: Voice quality and availability depend on the external StreamElements API.",
    category: "Fun",
    guide: {
      en: `{pn} <voice> <text>
Examples:
• {pn} goku Kamehameha!
• {pn} trump Make America great again!
• {pn} Hello there (random voice)
• {pn} Brian Hi! (using a custom StreamElements voice ID)`
    },
  },

  onStart: async function ({ message, args }) {
    if (!args[0]) return message.reply("⚠️ Please enter text or a voice with text. Use the guide: `!help say`");

    let voiceKey = args[0].toLowerCase();
    let text = args.slice(1).join(" ");
    let finalVoiceId;
    let displayName;

    // --- 🎭 Character-to-Voice Mapping (StreamElements) ---
    // Note: These are STYLIZED voices and not the actual celebrity/anime voices.
    const characterVoices = {
      // 🦸 Anime & Game (Using high-quality, expressive SE voices)
      goku: "Brian",
      vegeta: "Matthew",
      naruto: "Justin",
      sasuke: "Russell",
      luffy: "Arthur",
      zoro: "Brian",
      sanji: "Joey",
      gojo: "George",
      itachi: "Matthew",
      tanjiro: "Kevin",
      nezuko: "Kimberly",
      eren: "Joey",
      levi: "Russell",
      saitama: "Brian",
      pikachu: "Ivy", // Child/Cartoon voice

      // 🧍 Celebrity & Political
      trump: "Brian",
      obama: "Matthew",
      elon: "Joey",
      musk: "Joey",
      biden: "Brian",
      putin: "Matthew",
      taylor: "Salli",
      selena: "Kimberly",
      mark: "Russell",
      drake: "George",
      messi: "Arthur",
      ronaldo: "Matthew",

      // 🇦🇺 Added Custom/International Voices
      aussie: "Olivia", // Australian Accent
      indian: "Aditi",   // Indian Accent
      british: "Amy",  // British Accent
    };

    // --- Logic for determining voice and text ---
    
    // 1. If user only provides text (e.g., "!say Hello")
    if (!text) {
      text = voiceKey;
      voiceKey = "random"; 
    }

    // 2. Random Voice Selection
    if (voiceKey === "random") {
      const availableKeys = Object.keys(characterVoices);
      const randomKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
      finalVoiceId = characterVoices[randomKey];
      displayName = randomKey.toUpperCase();
      message.reply(`🎲 Random voice selected: ${displayName}`);
    } 
    
    // 3. Pre-defined Character Voice
    else if (characterVoices[voiceKey]) {
      finalVoiceId = characterVoices[voiceKey];
      displayName = voiceKey.toUpperCase();
    } 
    
    // 4. Direct StreamElements Voice ID (e.g., "!say Joanna Hi")
    // This allows the user to try any voice ID like "Joanna", "Ivy", "Salli", etc.
    else {
      finalVoiceId = voiceKey;
      displayName = `CUSTOM (${voiceKey.toUpperCase()})`;
      if (args.length === 1) {
          // If the voice ID was mistaken for text and there's no other argument, 
          // we use the 'random' text fallback but keep the custom voice ID
          text = finalVoiceId;
          finalVoiceId = "random"; 
          displayName = "RANDOM";
          // We need to re-slice the text if the voice was meant to be a custom voice 
          // but the text was missing, we use it as text and choose a random voice.
          voiceKey = "random"; 
          message.reply("⚠️ No text provided. Using your input as text and selecting a RANDOM voice.");
      }
    }


    // --- Voice Generation ---

    // The HuggingFace block is removed as it's typically rate-limited or requires
    // an API token for reliable service, and the original implementation didn't
    // handle the asynchronous nature of the model loading correctly.

    try {
      const audioUrl = `${URL_TTS}?voice=${encodeURIComponent(finalVoiceId)}&text=${encodeURIComponent(text)}`;

      if (!audioUrl) return message.reply("❌ Voice generation failed. The API URL could not be constructed.");
      
      const audioStream = await global.utils.getStreamFromURL(audioUrl);
      
      // Check if the stream is a valid audio file (StreamElements returns an audio file)
      if (audioStream && audioStream.length > 100) { // Simple check for a non-empty file
         return message.reply({
            body: `🎙️ ${displayName} says: "${text.length > 50 ? text.substring(0, 50) + "..." : text}"`,
            attachment: audioStream,
         });
      } else {
         message.reply("❌ Failed to generate audio. The chosen voice or text might not be supported by the API.");
      }

    } catch (err) {
      console.error("TTS Error:", err);
      // More descriptive error message for the user
      message.reply("❌ Failed to generate voice. This may be due to an API error, rate limit, or an unsupported voice/text. Try a different voice or shorter text.");
    }
  },
};
