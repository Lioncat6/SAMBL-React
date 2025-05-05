export default async function handler(req, res) {
    try {
        res.status(200).json({message: "Pong"});
	} catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}