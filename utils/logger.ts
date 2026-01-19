import log4js from "log4js";

log4js.configure({
	appenders: {
		console: {
			type: "console",
		},
		file: { type: "file", filename: "logs/app.log" },
	},
	categories: {
		default: { appenders: ["console"], level: "debug"},
	},
});

const logger = log4js.getLogger();

export default logger;
