import { Cameras, VideoEntryTypes } from "./Models";

const fileNameRegex = /(?<year>20\d{2})\-(?<month>[0-1][0-9])\-(?<day>[0-3][0-9])_(?<hour>[0-2][0-9])\-(?<minute>[0-5][0-9])\-(?<second>[0-5][0-9])\-(?<camera>back|front|left_repeater|right_repeater)/

export const eventFolderRegex = /(?<event>(?<year>20\d{2})\-(?<month>[0-1][0-9])\-(?<day>[0-3][0-9])_(?<hour>[0-2][0-9])\-(?<minute>[0-5][0-9])\-(?<second>[0-5][0-9]))/

export class VideoFile {
	public url: string;
	public fileName: string;
	public eventFolderName: string;
	public type: VideoEntryTypes | null;
	public startDate: Date;
	public endDate: Date;
	public durationInSeconds: number | null;
	public camera: Cameras;

	static async create(file: File) {
		var filePathMatch = file.webkitRelativePath.match(fileNameRegex);
		if (!filePathMatch)
			return null;

		const url = URL.createObjectURL(file);
		const duration = await VideoFile.analyzeDuration(url);
		if (!duration)
			return null;

		var entry = new VideoFile();

		var pathCharacter = file.webkitRelativePath.indexOf("/") != -1 ? "/" : "\\";
		var splitPath = file.webkitRelativePath.split(pathCharacter);

		entry.url = url;
		entry.fileName = splitPath[splitPath.length - 1];
		entry.eventFolderName = VideoFile.getEventFolderName(file.webkitRelativePath);
		entry.type = VideoFile.getClipType(splitPath);
		entry.startDate = new Date(`${filePathMatch.groups.year}-${filePathMatch.groups.month}-${filePathMatch.groups.day}T${filePathMatch.groups.hour}:${filePathMatch.groups.minute}:${filePathMatch.groups.second}`);
		entry.endDate = new Date(entry.startDate);
		entry.endDate.setSeconds(entry.endDate.getSeconds() + duration);
		entry.durationInSeconds = duration;
		entry.camera = filePathMatch.groups.camera as Cameras;

		return entry;
	}

	private static async analyzeDuration(url) {
		let analyzer = document.createElement("video");
		analyzer.src = url;

		if (analyzer.duration)
			return analyzer.duration;

		for (let attempt = 1; attempt <= 10; attempt++) {
			await VideoFile.delay(5);

			if (analyzer.duration)
				return analyzer.duration;
		}

		console.log("Failed to get duration of file");

		return false;
	}

	private static delay(ms: number): Promise<void> {
		return new Promise<void>(resolve => setTimeout(resolve, ms));
	}

	private static getEventFolderName(path: string): string {
		const match = path.match(eventFolderRegex);
		return match ? match.groups["event"] : null;
	}

	private static getClipType(splitPath): VideoEntryTypes {
		for (var i = 0; i < splitPath.length - 1; i++) {
			switch (splitPath[i]) {
				case "RecentClips":
					return VideoEntryTypes.Recent;
				case "SavedClips":
					return VideoEntryTypes.Saved;
				case "SentryClips":
					return VideoEntryTypes.Sentry;
			}
		}

		return VideoEntryTypes.Unknown;
	}
}
