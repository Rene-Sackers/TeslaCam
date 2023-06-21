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
	timestamp: Date|string;
}