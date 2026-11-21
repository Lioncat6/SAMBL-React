import { youtube_v3 } from "@googleapis/youtube";

export const musicTopicId = '/m/04rlf';
export const musicCategoryId = '10';

interface YouTubeTopic {
    id: string,
    topic: string,
    parent?: boolean
}
//https://developers.google.com/youtube/data/reference/rest/v3/channels#topicDetails.topicIds[]
//https://gist.github.com/stpe/2951130dfc8f1d0d1a2ad736bef3b703?permalink_comment_id=4265208#gistcomment-4265208
const topics: YouTubeTopic[] = [
    { id: "/m/04rlf", topic: "Music", parent: true },
    { id: "/m/02mscn", topic: "Christian music" },
    { id: "/m/0ggq0m", topic: "Classical music" },
    { id: "/m/01lyv", topic: "Country" },
    { id: "/m/02lkt", topic: "Electronic music" },
    { id: "/m/0glt670", topic: "Hip hop music" },
    { id: "/m/05rwpb", topic: "Independent music" },
    { id: "/m/03_d0", topic: "Jazz" },
    { id: "/m/028sqc", topic: "Music of Asia" },
    { id: "/m/0g293", topic: "Music of Latin America" },
    { id: "/m/064t9", topic: "Pop music" },
    { id: "/m/06cqb", topic: "Reggae" },
    { id: "/m/06j6l", topic: "Rhythm and blues" },
    { id: "/m/06by7", topic: "Rock music" },
    { id: "/m/0gywn", topic: "Soul music" },
    { id: "/m/0bzvm2", topic: "Gaming", parent: true },
    { id: "/m/025zzc", topic: "Action game" },
    { id: "/m/02ntfj", topic: "Action-adventure game" },
    { id: "/m/0b1vjn", topic: "Casual game" },
    { id: "/m/02hygl", topic: "Music video game" },
    { id: "/m/04q1x3q", topic: "Puzzle video game" },
    { id: "/m/01sjng", topic: "Racing video game" },
    { id: "/m/0403l3g", topic: "Role-playing video game" },
    { id: "/m/021bp2", topic: "Simulation video game" },
    { id: "/m/022dc6", topic: "Sports game" },
    { id: "/m/03hf_rm", topic: "Strategy video game" },
    { id: "/m/06ntj", topic: "Sports", parent: true },
    { id: "/m/0jm_", topic: "American football" },
    { id: "/m/018jz", topic: "Baseball" },
    { id: "/m/018w8", topic: "Basketball" },
    { id: "/m/01cgz", topic: "Boxing" },
    { id: "/m/09xp_", topic: "Cricket" },
    { id: "/m/02vx4", topic: "Football" },
    { id: "/m/037hz", topic: "Golf" },
    { id: "/m/03tmr", topic: "Ice hockey" },
    { id: "/m/01h7lh", topic: "Mixed martial arts" },
    { id: "/m/0410tth", topic: "Motorsport" },
    { id: "/m/07bs0", topic: "Tennis" },
    { id: "/m/07_53", topic: "Volleyball" },
    { id: "/m/02jjt", topic: "Entertainment", parent: true },
    { id: "/m/09kqc", topic: "Humor" },
    { id: "/m/02vxn", topic: "Movies" },
    { id: "/m/05qjc", topic: "Performing arts" },
    { id: "/m/066wd", topic: "Professional wrestling" },
    { id: "/m/0f2f9", topic: "TV shows" },
    { id: "/m/019_rr", topic: "Lifestyle", parent: true },
    { id: "/m/032tl", topic: "Fashion" },
    { id: "/m/027x7n", topic: "Fitness" },
    { id: "/m/02wbm", topic: "Food" },
    { id: "/m/03glg", topic: "Hobby" },
    { id: "/m/068hy", topic: "Pets" },
    { id: "/m/041xxh", topic: "Physical attractiveness [Beauty]" },
    { id: "/m/07c1v", topic: "Technology" },
    { id: "/m/07bxq", topic: "Tourism" },
    { id: "/m/07yv9", topic: "Vehicles" },
    { id: "/m/098wr", topic: "Society", parent: true },
    { id: "/m/09s1f", topic: "Business" },
    { id: "/m/0kt51", topic: "Health" },
    { id: "/m/01h6rj", topic: "Military" },
    { id: "/m/05qt0", topic: "Politics" },
    { id: "/m/06bvp", topic: "Religion" },
    { id: "/m/01k8wb", topic: "Knowledge" }
];

export function getYouTubeTopic(id: string): string | null {
    return topics.find(topics => topics.id == id)?.topic ?? null
}

// https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US
const categories: youtube_v3.Schema$VideoCategory[] = [{
    "kind": "youtube#videoCategory",
    "etag": "grPOPYEUUZN3ltuDUGEWlrTR90U",
    "id": "1",
    "snippet": {
        "title": "Film & Animation",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "Q0xgUf8BFM8rW3W0R9wNq809xyA",
    "id": "2",
    "snippet": {
        "title": "Autos & Vehicles",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "qnpwjh5QlWM5hrnZCvHisquztC4",
    "id": "10",
    "snippet": {
        "title": "Music",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "HyFIixS5BZaoBdkQdLzPdoXWipg",
    "id": "15",
    "snippet": {
        "title": "Pets & Animals",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "PNU8SwXhjsF90fmkilVohofOi4I",
    "id": "17",
    "snippet": {
        "title": "Sports",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "5kFljz9YJ4lEgSfVwHWi5kTAwAs",
    "id": "18",
    "snippet": {
        "title": "Short Movies",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "ANnLQyzEA_9m3bMyJXMhKTCOiyg",
    "id": "19",
    "snippet": {
        "title": "Travel & Events",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "0Hh6gbZ9zWjnV3sfdZjKB5LQr6E",
    "id": "20",
    "snippet": {
        "title": "Gaming",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "q8Cp4pUfCD8Fuh8VJ_yl5cBCVNw",
    "id": "21",
    "snippet": {
        "title": "Videoblogging",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "cHDaaqPDZsJT1FPr1-MwtyIhR28",
    "id": "22",
    "snippet": {
        "title": "People & Blogs",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "3Uz364xBbKY50a2s0XQlv-gXJds",
    "id": "23",
    "snippet": {
        "title": "Comedy",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "0srcLUqQzO7-NGLF7QnhdVzJQmY",
    "id": "24",
    "snippet": {
        "title": "Entertainment",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "bQlQMjmYX7DyFkX4w3kT0osJyIc",
    "id": "25",
    "snippet": {
        "title": "News & Politics",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "Y06N41HP_WlZmeREZvkGF0HW5pg",
    "id": "26",
    "snippet": {
        "title": "Howto & Style",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "yBaNkLx4sX9NcDmFgAmxQcV4Y30",
    "id": "27",
    "snippet": {
        "title": "Education",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "Mxy3A-SkmnR7MhJDZRS4DuAIbQA",
    "id": "28",
    "snippet": {
        "title": "Science & Technology",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "p3lEirEJApyEkuWpaGEHoF-m-aA",
    "id": "29",
    "snippet": {
        "title": "Nonprofits & Activism",
        "assignable": true,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "4pIHL_AdN2kO7btAGAP1TvPucNk",
    "id": "30",
    "snippet": {
        "title": "Movies",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "Iqol1myDwh2AuOnxjtn2AfYwJTU",
    "id": "31",
    "snippet": {
        "title": "Anime/Animation",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "tzhBKCBcYWZLPai5INY4id91ss8",
    "id": "32",
    "snippet": {
        "title": "Action/Adventure",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "ii8nBGYpKyl6FyzP3cmBCevdrbs",
    "id": "33",
    "snippet": {
        "title": "Classics",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "Y0u9UAQCCGp60G11Arac5Mp46z4",
    "id": "34",
    "snippet": {
        "title": "Comedy",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "_YDnyT205AMuX8etu8loOiQjbD4",
    "id": "35",
    "snippet": {
        "title": "Documentary",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "eAl2b-uqIGRDgnlMa0EsGZjXmWg",
    "id": "36",
    "snippet": {
        "title": "Drama",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "HDAW2HFOt3SqeDI00X-eL7OELfY",
    "id": "37",
    "snippet": {
        "title": "Family",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "QHiWh3niw5hjDrim85M8IGF45eE",
    "id": "38",
    "snippet": {
        "title": "Foreign",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "ztKcSS7GpH9uEyZk9nQCdNujvGg",
    "id": "39",
    "snippet": {
        "title": "Horror",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "Ids1sm8QFeSo_cDlpcUNrnEBYWA",
    "id": "40",
    "snippet": {
        "title": "Sci-Fi/Fantasy",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "qhfgS7MzzZHIy_UZ1dlawl1GbnY",
    "id": "41",
    "snippet": {
        "title": "Thriller",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "TxVSfGoUyT7CJ7h7ebjg4vhIt6g",
    "id": "42",
    "snippet": {
        "title": "Shorts",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "o9w6eNqzjHPnNbKDujnQd8pklXM",
    "id": "43",
    "snippet": {
        "title": "Shows",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
},
{
    "kind": "youtube#videoCategory",
    "etag": "mLdyKd0VgXKDI6GevTLBAcvRlIU",
    "id": "44",
    "snippet": {
        "title": "Trailers",
        "assignable": false,
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ"
    }
}]

export function getYouTubeCategory(id: string | number): string | null {
    return categories.find(category => String(category.id) == String(id))?.snippet?.title ?? null
}