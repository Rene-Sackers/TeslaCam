import Enumerable = require("linq");
import { VideoFile } from "./VideoFile";

export enum Cameras {
	Front = "front",
	LeftRepeater = "left_repeater",
	RightRepeater = "right_repeater",
	Back = "back"
}

export enum VideoEntryTypes {
	Unknown = null,
	Sentry = "SentryClips",
	Saved = "SavedClips",
	Recent = "RecentClips"
}

// According to a random post on the internet
// 0 = front camera
// 1 = fisheye
// 2 = narrow
// 3 = left repeater
// 4 = right repeater
// 5 = left B pillar
// 6 = right B pillar
// 7 = rear
// 8 = cabin
export enum EventCameras {
	Front = "0",
	Fisheye = "1",
	Narrow = "2",
	LeftRepeater = "3",
	RightRepeater = "4",
	LeftBPillar = "5",
	RightBPillar = "6",
	Rear = "7",
	Cabin = "8"
}

export interface TeslaCamEvent {
	eventFolderName: string;
	camera: EventCameras;
	city: string;
	est_lat: string;
	est_lon: string;
	reason: string;
	timestamp: Date;
}

export class VideoSegment {
	startDate: Date;
	endDate: Date;
	cameraFront: VideoFile;
	cameraLeft: VideoFile;
	cameraRight: VideoFile;
	cameraBack: VideoFile;

	constructor(startDate: Date, videoFiles: VideoFile[])
	{
		const enumerable = Enumerable.from(videoFiles);

		this.startDate = startDate;
		this.endDate = new Date(startDate);
		this.endDate.setSeconds(this.endDate.getSeconds() + enumerable.first().durationInSeconds);
		this.cameraFront = enumerable.first(v => v.camera == Cameras.Front);
		this.cameraLeft = enumerable.first(v => v.camera == Cameras.LeftRepeater);
		this.cameraRight = enumerable.first(v => v.camera == Cameras.RightRepeater);
		this.cameraBack = enumerable.first(v => v.camera == Cameras.Back);
	}
}