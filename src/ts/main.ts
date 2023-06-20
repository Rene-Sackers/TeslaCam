import {Cameras} from "./Enums";
import Enumerable = require('linq');
import VideoEntry from "./VideoEntry";
import Clip from "./Clip";

export var fileNameRegex = /(?<year>20\d{2})\-(?<month>[0-1][0-9])\-(?<day>[0-3][0-9])_(?<hour>[0-2][0-9])\-(?<minute>[0-5][0-9])\-(?<second>[0-5][0-9])\-(?<camera>back|front|left_repeater|right_repeater)/
export var eventFolderRegex = /(?<year>20\d{2})\-(?<month>[0-1][0-9])\-(?<day>[0-3][0-9])_(?<hour>[0-2][0-9])\-(?<minute>[0-5][0-9])\-(?<second>[0-5][0-9])/

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

	var clips = Enumerable
		.from(videoEntries)
		.where(v => !!v.eventFolderName)
		.groupBy(v => v.eventFolderName)
		.select(g => Clip.create(g.toArray()));


	console.log(videoEntries);

	videoPlayerFront.src = Enumerable.from(videoEntries).where((v) => v.camera == Cameras.Front).first().url;
	videoPlayerLeft.src = Enumerable.from(videoEntries).where((v) => v.camera == Cameras.LeftRepeater).first().url;
	videoPlayerRight.src = Enumerable.from(videoEntries).where((v) => v.camera == Cameras.RightRepeater).first().url;
	videoPlayerBack.src = Enumerable.from(videoEntries).where((v) => v.camera == Cameras.Back).first().url;
}

(document.getElementById("input-directory") as HTMLInputElement).addEventListener("change", async (e) => {
	loadClips((e.target as HTMLInputElement).files);
});
