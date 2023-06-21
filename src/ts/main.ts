import Enumerable = require('linq');
import {Cameras, TeslaCamEvent} from "./Models";
import {VideoFile, eventFolderRegex} from "./VideoFile";
import Clip from "./Clip";

const videoPlayerFront = document.getElementById("video-front") as HTMLVideoElement;
const videoPlayerLeft = document.getElementById("video-left") as HTMLVideoElement;
const videoPlayerRight = document.getElementById("video-right") as HTMLVideoElement;
const videoPlayerBack = document.getElementById("video-back") as HTMLVideoElement;


async function getEvents(files: FileList): Promise<TeslaCamEvent[]> {
	const events = Enumerable
		.from(files)
		.where(f => f.name == "event.json")
		.select(f => ({
			file: f,
			regexMatch: f.webkitRelativePath.match(eventFolderRegex)
		}))
		.where(f => !!f.regexMatch)
		.select(f => ({
			file: f.file,
			eventFolderName: f.regexMatch.groups["event"]
		}))
		.toArray();
	
	const parsedEvents = [] as TeslaCamEvent[];
	const readPromises = Enumerable.from(events)
		.select(e => {
			const reader = new FileReader();
			return new Promise<void>((resolve) => {
				reader.addEventListener('load', (event) => {
					const data = JSON.parse(event.target.result as string);
					data.timestamp = new Date(data.timestamp);
					data.eventFolderName = e.eventFolderName;

					parsedEvents.push(data as TeslaCamEvent);
					resolve();
				});
				reader.readAsText(e.file);
			});
		})
		.toArray();
	await Promise.all(readPromises);

	return parsedEvents;
}

async function loadClips(files: FileList) {

	const videoEntries = [] as VideoFile[];
	for (let i = 0; i < files.length; i++) {
		const entry = await VideoFile.create(files[i]);
		if (!entry)
			continue;
		
		videoEntries.push(entry);
		console.log(`Analyzing video ${i + 1}/${files.length}`);
	}
	const eventInfos = Enumerable.from(await getEvents(files));
	console.log(Enumerable
		.from(videoEntries)
		.where(v => !!v.eventFolderName)
		.groupBy(v => v.eventFolderName).toArray());

	var clips = Enumerable
		.from(videoEntries)
		.where(v => !!v.eventFolderName)
		.groupBy(v => v.eventFolderName)
		.select(g => new Clip(g.toArray(), eventInfos.firstOrDefault(e => e.eventFolderName == g.key())))
		.toArray();
	
	playClip(clips[0]);
}

function playClip(clip: Clip) {
	const firstSegmentVideos = clip.videoSegments.toEnumerable().first().value;
	console.log(firstSegmentVideos);
	
	videoPlayerFront.src = Enumerable.from(firstSegmentVideos).where((v) => v.camera == Cameras.Front).first().url;
	videoPlayerLeft.src = Enumerable.from(firstSegmentVideos).where((v) => v.camera == Cameras.LeftRepeater).first().url;
	videoPlayerRight.src = Enumerable.from(firstSegmentVideos).where((v) => v.camera == Cameras.RightRepeater).first().url;
	videoPlayerBack.src = Enumerable.from(firstSegmentVideos).where((v) => v.camera == Cameras.Back).first().url;
}

(document.getElementById("input-directory") as HTMLInputElement).addEventListener("change", async (e) => {
	loadClips((e.target as HTMLInputElement).files);
});
