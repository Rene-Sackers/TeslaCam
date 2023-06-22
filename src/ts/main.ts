import Enumerable = require('linq');
import {Cameras, TeslaCamEvent, VideoSegment} from "./Models";
import {VideoFile, eventFolderRegex} from "./VideoFile";
import Clip from "./Clip";

const videoPlayerFront = document.getElementById("video-front") as HTMLVideoElement;
const videoPlayerLeft = document.getElementById("video-left") as HTMLVideoElement;
const videoPlayerRight = document.getElementById("video-right") as HTMLVideoElement;
const videoPlayerBack = document.getElementById("video-back") as HTMLVideoElement;
const videoTrackSlider = document.getElementById("video-track-slider") as HTMLInputElement;
const playButton = document.getElementById("play-button") as HTMLButtonElement;
const eventMarker = document.getElementById("event-marker") as HTMLDivElement;
const eventSelect = document.getElementById("event-select") as HTMLSelectElement;

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

let clips: {[key: string]: Clip} = {};
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

	eventSelect.innerHTML = "";
	clips = {};
	console.log(Enumerable
		.from(videoEntries)
		.where(v => !!v.eventFolderName)
		.select(v => v.eventFolderName)
		.distinct()
		.toArray());
	Enumerable
		.from(videoEntries)
		.where(v => !!v.eventFolderName)
		.groupBy(v => v.eventFolderName)
		.select(g => new Clip(g.toArray(), eventInfos.firstOrDefault(e => e.eventFolderName == g.key())))
		.forEach(c => {
			clips[c.eventFolderName] = c

			const option = document.createElement("option");
			option.innerText = c.type + " - " + c.eventFolderName;
			option.value = c.eventFolderName;
			eventSelect.appendChild(option);
		});

	playClip(Enumerable.from(clips).first().value);
}

function manipulatePlayers(callback: (player: HTMLVideoElement) => void)
{
	callback(videoPlayerFront);
	callback(videoPlayerLeft);
	callback(videoPlayerRight);
	callback(videoPlayerBack);
}

let currentClip: Clip;
let currentSegment: VideoSegment;
function playClip(clip: Clip) {
	manipulatePlayers(p => p.pause());
	currentClip = clip;
	currentSegment = null;

	if (clip.teslaCamEvent)
	{
		const secondsFromStart = (clip.teslaCamEvent.timestamp.getTime() - clip.startDate.getTime()) / 1000;
		console.log("Event at " + secondsFromStart);
		eventMarker.style.left = Math.max(0, Math.min(100, (secondsFromStart / clip.totalDurationInSeconds) * 100)) + "%";
		eventMarker.style.display = "block";
	}
	else
	{
		eventMarker.style.display = "none";
	}

	videoTrackSlider.max = clip.totalDurationInSeconds.toString();
	videoTrackSlider.step = "0.1";
	videoTrackSlider.value = "0";

	seekTo(0);
}

function loadSegment(videoSegment: VideoSegment) {
	console.log("Load segment: " + videoSegment.cameraFront.fileName);
	videoPlayerFront.src = videoSegment.cameraFront.url;
	videoPlayerLeft.src = videoSegment.cameraLeft.url;
	videoPlayerRight.src = videoSegment.cameraRight.url;
	videoPlayerBack.src = videoSegment.cameraBack.url;
}

function seekTo(seconds: number) {
	const seekToDate = new Date(currentClip.startDate);
	seekToDate.setSeconds(seekToDate.getSeconds() + seconds);

	if (!currentSegment || seekToDate < currentSegment.startDate || seekToDate > currentSegment.endDate)
	{
		currentSegment = currentClip.getSegmentAtDate(seekToDate);
		loadSegment(currentSegment);
	}

	const seekSecondsInCurrentSegment = (seekToDate.getTime() - currentSegment.startDate.getTime()) / 1000;
	manipulatePlayers(p => p.currentTime = seekSecondsInCurrentSegment);
}

function togglePlaying()
{
	if (videoPlayerFront.paused)
		manipulatePlayers(p => p.play());
	else
		manipulatePlayers(p => p.pause());
}

document.addEventListener("keyup", e => {
	if (e.code == "Space")
		togglePlaying();
});

playButton.addEventListener("click", togglePlaying);

let isManipulatingSeeker = false;
let wasPlayingBeforeManipulate = false;
videoTrackSlider.addEventListener("mousedown", () => {
	isManipulatingSeeker = true;
	wasPlayingBeforeManipulate = !videoPlayerFront.paused;
});

videoTrackSlider.addEventListener("mouseup", () => {
	isManipulatingSeeker = false;
	if (wasPlayingBeforeManipulate)
		manipulatePlayers(p => p.play());
});

videoTrackSlider.addEventListener("input", (e: Event) => {
	if (!videoPlayerFront.paused)
		manipulatePlayers(p => p.pause());

	seekTo(parseFloat(videoTrackSlider.value));
});

videoPlayerFront.addEventListener("timeupdate", () => {
	if (isManipulatingSeeker)
		return;
	
	const clipOffsetSeconds = (currentSegment.startDate.getTime() - currentClip.startDate.getTime()) / 1000;
	const timeFromStartOfClip = clipOffsetSeconds + videoPlayerFront.currentTime;
	videoTrackSlider.value = timeFromStartOfClip.toString();
});

videoPlayerFront.addEventListener("ended", () => {
	const currentSegmentIndex = currentClip.videoSegments.indexOf(currentSegment);
	if (currentSegmentIndex >= currentClip.videoSegments.count() - 1)
		return;

	loadSegment(currentClip.videoSegments.elementAt(currentSegmentIndex + 1));
	manipulatePlayers(p => p.play());
});

eventSelect.addEventListener("change", () => playClip(clips[eventSelect.value]));

(document.getElementById("input-directory") as HTMLInputElement).addEventListener("change", async (e) => {
	loadClips((e.target as HTMLInputElement).files);
});
