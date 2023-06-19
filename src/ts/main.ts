const Enumerable = require('linq');
//import Test from './test';

//console.log(new Test().testValue);

var fileNameRegex = /(?<year>20\d{2})\-(?<month>[0-1][0-9])\-(?<day>[0-3][0-9])_(?<hour>[0-2][0-9])\-(?<minute>[0-5][0-9])\-(?<second>[0-5][0-9])\-(?<camera>back|front|left_repeater|right_repeater)/
var eventFolderRegex = /(?<year>20\d{2})\-(?<month>[0-1][0-9])\-(?<day>[0-3][0-9])_(?<hour>[0-2][0-9])\-(?<minute>[0-5][0-9])\-(?<second>[0-5][0-9])/

var videoEntryType = {
	Unknown: "unknown",
	Sentry: "sentry",
	Saved: "saved",
	Recent: "recent"
};

var cameras = {
	Front: "front",
	LeftRepeater: "left_repeater",
	RightRepeater: "right_repeater",
	Back: "back"
};

class VideoEntry
{
	url;
	fileName;
	eventFolderName;
	type;
	date;
	durationInSeconds;
	camera;

	static async create(file) {
		var filePathMatch = file.webkitRelativePath.match(fileNameRegex);
		if (!filePathMatch)
			return null;

		const url = URL.createObjectURL(file);
		const duration = await VideoEntry.analyzeDuration(url);
		if (!duration)
			return null;

		var entry = new VideoEntry();

		var pathCharacter = file.webkitRelativePath.indexOf("/") != "-1" ? "/" : "\\";
		var splitPath = file.webkitRelativePath.split(pathCharacter);

		entry.url = url;
		entry.fileName = splitPath[splitPath.length - 1];
		entry.eventFolderName = VideoEntry.getEventFolderName(splitPath);
		entry.type = VideoEntry.getClipType(splitPath);
		entry.date = new Date(`${filePathMatch.groups.year}-${filePathMatch.groups.month}-${filePathMatch.groups.day}T${filePathMatch.groups.hour}:${filePathMatch.groups.minute}:${filePathMatch.groups.second}`)
		entry.durationInSeconds = duration;
		entry.camera = filePathMatch.groups.camera;
		
		return entry;
	}

	static async analyzeDuration(url) {
		let analyzer = document.createElement("video");
		analyzer.src = url;

		if (analyzer.duration)
				return analyzer.duration;

		for (let attempt = 1; attempt <= 10; attempt++) {                    
			await VideoEntry.delay(5);

			if (analyzer.duration)
				return analyzer.duration;
		}

		console.log("Failed to get duration of file");

		return false;
	}

	static delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	static getEventFolderName(splitPath) {
		if (splitPath.length == 1)
			return null;

		var parentFolderName = splitPath[splitPath.length - 2];
		if (parentFolderName.match(eventFolderRegex))
			return parentFolderName;
	}

	static getClipType(splitPath) {
		for (var i = 0; i < splitPath.length - 1; i++)
		{
			switch (splitPath[i])
			{
				case "RecentClips":
					return videoEntryType.Recent;
				case "SavedClips":
					return videoEntryType.Saved;
				case "SentryClips":
					return videoEntryType.Sentry;
			}
		}

		return videoEntryType.Unknown;
	}
}

var videoPlayerFront = document.getElementById("video-front") as HTMLVideoElement;
var videoPlayerLeft = document.getElementById("video-left") as HTMLVideoElement;
var videoPlayerRight = document.getElementById("video-right") as HTMLVideoElement;
var videoPlayerBack = document.getElementById("video-back") as HTMLVideoElement;
var videoEntries = [] as VideoEntry[];

async function loadClips(files) {

	for (let i = 0; i < files.length; i++) {
		const entry = await VideoEntry.create(files[i]);
		if (!entry)
			continue;
		
		videoEntries.push(entry);
		console.log(`${i + 1}/${files.length}`);
	}

	console.log(videoEntries);

	videoPlayerFront.src = Enumerable.from(videoEntries).where((v) => v.camera == cameras.Front).first().url;
	videoPlayerLeft.src = Enumerable.from(videoEntries).where((v) => v.camera == cameras.LeftRepeater).first().url;
	videoPlayerRight.src = Enumerable.from(videoEntries).where((v) => v.camera == cameras.RightRepeater).first().url;
	videoPlayerBack.src = Enumerable.from(videoEntries).where((v) => v.camera == cameras.Back).first().url;
}

(document.getElementById("input-directory") as HTMLInputElement).addEventListener("change", async (e) => {
	loadClips((e.target as HTMLInputElement).files);
});