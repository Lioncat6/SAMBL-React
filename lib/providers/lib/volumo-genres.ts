export default function getVolumoGenre(number?: number | null): string | null {
    if (!number) return null;
    const genre = volumoGenresResponse.find((g) => g.id === number);
    return genre ? genre.name : null;
}

// Can be fetched via https://volumo.com/api/v1/genres
const volumoGenresResponse = [
  {
    "id": 1,
    "name": "Afro House",
    "slug": "afro-house",
    "featured": true,
    "description": "Afro House is a sub-genre of house music that originated in South Africa and incorporates African elements and rhythms into the electronic dance music framework. Sub-genres: Afro Tech, Afro Deep, Afro Soulful, Afro Tribal, Afro Funk, Afro Latin, Kwaito, Gqom, Amapiano. In 2026, you can buy and download the latest Afro House tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#09E017",
    "focus_banner_fg_color": "#11300A",
    "rotation_banner_bg_color": "#3D0603",
    "rotation_banner_fg_color": "#F1FF00"
  },
  {
    "id": 33,
    "name": "Amapiano",
    "slug": "amapiano",
    "featured": false,
    "description": "Amapiano is a sub-genre of house music that emerged in South Africa in the mid-2010s, characterized by its signature \"log drum\" basslines, soulful synths, and percussive melodies. In 2026, you can buy and download the latest Amapiano tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": null,
    "focus_banner_fg_color": null,
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 2,
    "name": "Bass House / Future House",
    "slug": "bass-house-future-house",
    "featured": true,
    "description": "Bass House and Future House are dynamic sub-genres of house music that emphasize heavy basslines, metallic synths, and hard-hitting beats. This selection includes UK Bass, Future House, Wobble, and Garage House styles. In 2026, you can buy and download these tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#061F69",
    "focus_banner_fg_color": "#0A4BFF",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 3,
    "name": "Breaks / Breakbeat",
    "slug": "breaks-breakbeat",
    "featured": true,
    "description": "Breaks and Breakbeat are rhythmic, beat-driven genres of electronic music defined by syncopated patterns. This collection includes Big Beat, Nu Skool, Progressive, Florida, and Atmospheric Breaks. In 2026, you can buy and download the best Breakbeat tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#DD0000",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 35,
    "name": "Dance / Pop",
    "slug": "dance-pop",
    "featured": false,
    "description": "",
    "focus_banner_bg_color": null,
    "focus_banner_fg_color": null,
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 4,
    "name": "Deep House",
    "slug": "deep-house",
    "featured": true,
    "description": "Deep House is a soulful, melodic variant of house music characterized by smooth chords, atmospheric pads, and sophisticated grooves. This selection includes Tribal, Afro Deep, and Deep Tech House. In 2026, you can buy and download these tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#2C0D7D",
    "focus_banner_fg_color": "#5800EB",
    "rotation_banner_bg_color": "#5800EB",
    "rotation_banner_fg_color": "#FAE3E2"
  },
  {
    "id": 5,
    "name": "DJ Tools",
    "slug": "dj-tools",
    "featured": false,
    "description": "Tracks or elements designed for DJs to use in live performances. Acapellas, Loops, Samples, DJ Intros/Outros.",
    "focus_banner_bg_color": null,
    "focus_banner_fg_color": null,
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 6,
    "name": "Drum and Bass",
    "slug": "drum-and-bass",
    "featured": true,
    "description": "Drum & Bass is fast-paced electronic music defined by complex breakbeats and heavy basslines. This collection includes Liquid, Neurofunk, Jump Up, Jungle, Techstep, Darkstep, Drumfunk, and Atmospheric DnB. In 2026, you can buy and download the latest D&B tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#0D282C",
    "focus_banner_fg_color": "#00E5FF",
    "rotation_banner_bg_color": "#E3FDB1",
    "rotation_banner_fg_color": "#5800EB"
  },
  {
    "id": 7,
    "name": "Dubstep / Bass / Grime",
    "slug": "dubstep-bass-grime",
    "featured": true,
    "description": "Dubstep, Bass, and Grime are genres of electronic music defined by heavy basslines, sub-bass frequencies, and syncopated rhythms. This selection includes Brostep, Riddim, Chillstep, Melodic, Wonky, Deathstep, Glitchstep, and Deep Dubstep. In 2026, you can buy and download these tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#511D08",
    "focus_banner_fg_color": "#FF5714",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 27,
    "name": "Electro (Classic / Detroit)",
    "slug": "electro-classic-detroit",
    "featured": true,
    "description": "Electro and Classic Detroit are early forms of electronic dance music defined by futuristic themes, robotic funk, and synthesized breakbeats. This selection includes Detroit Techno, Electro Funk, Electro Breaks, and Electroclash. In 2026, you can buy and download these timeless tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#F1FF00",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 9,
    "name": "Electro House / Big Room / Mainstage",
    "slug": "electro-house-big-room",
    "featured": false,
    "description": "Electro House and Big Room are energetic, hard-hitting genres of dance music defined by heavy basslines and high-octane drops. This selection includes Progressive Electro House, Complextro, Dutch House, Fidget, Dirty Dutch, and Melbourne Bounce. In 2026, you can buy and download these festival anthems on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#CED1D6",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 8,
    "name": "Electronica",
    "slug": "electronica",
    "featured": true,
    "description": "Electronica is a diverse, experimental genre of electronic music defined by intricate textures and wide-ranging influences. This selection includes IDM, Ambient, Downtempo, Glitch, Trip Hop, Breakcore, and cinematic Soundscapes. In 2026, you can buy and download these experimental tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#00A242",
    "focus_banner_fg_color": "#0F2D16",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 10,
    "name": "Funky / Jackin' House",
    "slug": "funky-jackin-house",
    "featured": true,
    "description": "Funky and Jackin' House is upbeat electronic music infused with disco, funk, and soul elements, known for its infectious grooves and swing rhythms. This selection features Disco House, French House, Filter House, Glitch, and Chicago House. In 2026, you can buy and download these groovy tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#09E017",
    "focus_banner_fg_color": "#11300A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 28,
    "name": "Hardcore / Hard Dance",
    "slug": "hardcore-hard-dance",
    "featured": true,
    "description": "Hardcore and Hard Dance are high-energy genres of electronic music defined by fast tempos, distorted kicks, and intense synth melodies. This selection features UK Hardcore, Gabber, Frenchcore, Happy Hardcore, and Hardstyle. In 2026, you can buy and download the hardest tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#04070A",
    "focus_banner_fg_color": "#CED1D6",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 11,
    "name": "Hard Techno",
    "slug": "hard-techno",
    "featured": true,
    "description": "Hard Techno is an intense, high-tempo sub-genre of techno characterized by industrial sounds, distorted percussion, and driving acid basslines. This selection includes Industrial Techno, Schranz, Dark Techno, and Peak Time Hard Techno. In 2026, you can buy and download the most powerful Hard Techno tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#DD0000",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 12,
    "name": "House",
    "slug": "house",
    "featured": true,
    "description": "House is a foundational genre of electronic dance music characterized by its repetitive 4/4 beat, soulful melodies, and iconic basslines. This extensive collection spans Deep House, Tech House, Progressive, Funky, and Soulful House. In 2026, you can buy and download the latest House tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#5800EB",
    "focus_banner_fg_color": "#2C0D7D",
    "rotation_banner_bg_color": "#FAE5DB",
    "rotation_banner_fg_color": "#1E0756"
  },
  {
    "id": 13,
    "name": "Indie Dance / Dark Disco",
    "slug": "indie-dance-dark-disco",
    "featured": true,
    "description": "Indie Dance and Dark Disco are atmospheric genres that blend 80s synth-pop aesthetics with modern club grooves and hypnotic basslines. This collection features Nu-Disco, Italo Disco, Synthwave, and Post-Punk influenced electronic music. In 2026, you can buy and download these curated tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#99FF00",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": "#092005",
    "rotation_banner_fg_color": "#FAE5DB"
  },
  {
    "id": 30,
    "name": "Leftfield",
    "slug": "leftfield",
    "featured": false,
    "description": "Leftfield is experimental and unconventional electronic music that defies traditional genre boundaries through innovative sound design. This collection includes Leftfield Bass, House & Techno, Avant-garde, Musique Concrète, and Drone Music. In 2026, you can buy and download these boundary-pushing tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": null,
    "focus_banner_fg_color": null,
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 14,
    "name": "Lounge / Chill Out",
    "slug": "lounge-chill-out",
    "featured": false,
    "description": "Lounge and Chill Out are relaxing, downtempo genres of electronic music characterized by smooth atmospheric pads, organic textures, and mellow rhythms. This selection features Balearic, Ambient, Chill-hop, and Easy Listening styles. In 2026, you can buy and download these high-quality tracks on Volumo in MP3, WAV, AIFF, and FLAC formats for the ultimate listening experience.",
    "focus_banner_bg_color": null,
    "focus_banner_fg_color": null,
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 15,
    "name": "Melodic House / Techno",
    "slug": "melodic-house-techno",
    "featured": true,
    "description": "Melodic House & Techno are emotive sub-genres of electronic music characterized by driving rhythms, harmonic synth layers, and atmospheric soundscapes. This selection includes Progressive, Peak Time Melodic, and Etherial Techno styles. In 2026, you can buy and download the latest tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#0A4BFF",
    "focus_banner_fg_color": "#061F69",
    "rotation_banner_bg_color": "#092005",
    "rotation_banner_fg_color": "#00E5FF"
  },
  {
    "id": 26,
    "name": "Microhouse / Rominimal",
    "slug": "microhouse",
    "featured": true,
    "description": "Microhouse and Rominimal are sophisticated sub-genres of electronic music characterized by subtle glitchy textures, organic percussion, and stripped-back hypnotic grooves. This selection features Minimal House, Romanian Techno, and Glitch-influenced electronic music. In 2026, you can buy and download these refined tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#CED1D6",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 16,
    "name": "Minimal / Deep Tech",
    "slug": "minimal-deep-tech",
    "featured": true,
    "description": "Minimal and Deep Tech are sophisticated genres of house music defined by stripped-back arrangements, intricate percussion, and deep, rolling basslines. This selection includes Minimal Techno, Deep Tech House, and Dub-influenced Minimal. In 2026, you can buy and download these essential club tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#CED1D6",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": "#E5EBFD",
    "rotation_banner_fg_color": "#0A4BFF"
  },
  {
    "id": 17,
    "name": "Nu-Disco / Soul / Funk",
    "slug": "nudisco-soul-funk",
    "featured": true,
    "description": "Nu-Disco, Soul, and Funk are vibrant genres that blend vintage grooves with modern electronic production, featuring soulful vocals, live basslines, and shimmering synthesizers. This selection includes Disco Edit, Funky House, Neo-Soul, and Boogie-influenced tracks. In 2026, you can buy and download these high-fidelity tracks on Volumo in MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#FF5714",
    "focus_banner_fg_color": "#391504",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 18,
    "name": "Organic House / Downtempo",
    "slug": "organic-house",
    "featured": true,
    "description": "Organic House and Downtempo are soulful, melodic genres characterized by acoustic instruments, tribal rhythms, and lush natural soundscapes. This collection features Afro House, Spiritual Downtempo, Deep Organic, and Folktronica. In 2026, you can buy and download these evocative tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats for a truly immersive listening experience.",
    "focus_banner_bg_color": "#09E017",
    "focus_banner_fg_color": "#11300A",
    "rotation_banner_bg_color": "#092005",
    "rotation_banner_fg_color": "#09E017"
  },
  {
    "id": 19,
    "name": "Progressive House",
    "slug": "progressive-house",
    "featured": true,
    "description": "Progressive House is a melodic and atmospheric genre of electronic music known for its long builds, driving basslines, and euphoric breakdowns. This selection includes Melodic Progressive, Peak Time, and Deep Progressive styles. In 2026, you can buy and download these top-tier tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#F1FF00",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": "#DD0000",
    "rotation_banner_fg_color": "#E3FDB1"
  },
  {
    "id": 32,
    "name": "Psy-Trance",
    "slug": "psy-trance",
    "featured": true,
    "description": "Psy-Trance is a high-energy, psychedelic sub-genre of trance music defined by hypnotic arrangements, driving basslines, and intricate synth layers. This selection features Full-On, Progressive Psy, Goa Trance, Darkpsy, and Forest styles. In 2026, you can buy and download the best Psychedelic Trance on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#00E5FF",
    "focus_banner_fg_color": "#0D282C",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 20,
    "name": "Soulful House",
    "slug": "soulful-house",
    "featured": true,
    "description": "Soulful House is an uplifting and sophisticated genre that blends traditional House rhythms with the rich textures of Gospel, Jazz, and R&B. This collection features tracks with powerful vocals, live piano chords, and warm basslines. In 2026, you can buy and download the finest Soulful House on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#99FF00",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 29,
    "name": "Soul / R&B / Hip-Hop",
    "slug": "soul-rnb-hip-hop",
    "featured": false,
    "description": "Soul, R&B, and Hip-Hop are foundational genres defined by smooth melodies, rhythmic groove, and lyrical storytelling. This selection includes Neo-Soul, Contemporary R&B, Boom Bap, Trap, and Jazz-influenced tracks. In 2026, you can buy and download these essential releases on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#511D08",
    "focus_banner_fg_color": "#FF5714",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 21,
    "name": "Tech House",
    "slug": "tech-house",
    "featured": true,
    "description": "Tech House is a dynamic fusion of house and techno that prioritizes rhythmic drive and intricate percussion over melodic complexity. This collection spans Tribal Tech House, Deep Tech, Minimal, Acid, and Dub-influenced Tech House. In 2026, you can buy and download the most effective club weapons on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#2C0D7D",
    "focus_banner_fg_color": "#5800EB",
    "rotation_banner_bg_color": "#0E022B",
    "rotation_banner_fg_color": "#FF5714"
  },
  {
    "id": 23,
    "name": "Techno (Peak Time)",
    "slug": "techno-peak-time",
    "featured": true,
    "description": "Techno (Peak Time) is a high-octane, driving genre designed for the most intense moments of a DJ set, featuring powerful kick drums, sharp percussion, and anthemic synth stabs. This selection includes Driving Techno, Mainstage Techno, and Acid-infused Peak Time tracks. In 2026, you can buy and download these explosive club anthems on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#DD0000",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": "#3D0603",
    "rotation_banner_fg_color": "#DD0000"
  },
  {
    "id": 22,
    "name": "Techno (Raw, Deep, Dub)",
    "slug": "techno-raw-deep-dub",
    "featured": true,
    "description": "Techno (Raw, Deep, Dub) is a sophisticated sub-genre focused on atmospheric depth, gritty analog textures, and hypnotic repetition. This selection features Warehouse Techno, Dub-influenced soundscapes, and Raw, unpolished rhythms. In 2026, you can buy and download these authentic underground tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#04070A",
    "focus_banner_fg_color": "#CED1D6",
    "rotation_banner_bg_color": "#3D0603",
    "rotation_banner_fg_color": "#DD0000"
  },
  {
    "id": 24,
    "name": "Trance",
    "slug": "trance",
    "featured": true,
    "description": "Trance is an uplifting and melodic genre of electronic music defined by its hypnotic rhythms, expansive synth layers, and emotional builds. This selection features Vocal Trance, Uplifting, Progressive Trance, and Tech-Trance styles. In 2026, you can buy and download the most transcendent tracks on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats for a superior sonic journey.",
    "focus_banner_bg_color": "#0D282C",
    "focus_banner_fg_color": "#00E5FF",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  },
  {
    "id": 25,
    "name": "UK Garage / 2-Step",
    "slug": "uk-garage-2-step",
    "featured": true,
    "description": "UK Garage and 2-Step are iconic urban genres defined by their infectious swing, syncopated drum patterns, and chopped vocal samples. This selection features Old Skool Garage, Modern UKG, Bassline-influenced tracks, and soulful 2-Step grooves. In 2026, you can buy and download the ultimate garage collection on Volumo in high-quality MP3, WAV, AIFF, and FLAC formats.",
    "focus_banner_bg_color": "#CED1D6",
    "focus_banner_fg_color": "#04070A",
    "rotation_banner_bg_color": null,
    "rotation_banner_fg_color": null
  }
]