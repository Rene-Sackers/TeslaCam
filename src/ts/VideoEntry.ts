import { Cameras, VideoEntryTypes } from "./Enums";
import { fileNameRegex, eventFolderRegex } from "./main";

export default class VideoEntry {
	public url: string;
	public fileName: string;
	public eventFolderName: string;
	public type: VideoEntryTypes | null;
	public date: Date;
	public durationInSeconds: number | null;
	public camera: Cameras;

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
		entry.date = new Date(`${filePathMatch.groups.year}-${filePathMatch.groups.month}-${filePathMatch.groups.day}T${filePathMatch.groups.hour}:${filePathMatch.groups.minute}:${filePathMatch.groups.second}`);
		entry.durationInSeconds = duration;
		entry.camera = filePathMatch.groups.camera;

		return entry;
	}

	private static async analyzeDuration(url) {
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

	private static delay(ms: number): Promise<void> {
		return new Promise<void>(resolve => setTimeout(resolve, ms));
	}

	private static getEventFolderName(splitPath): string {
		if (splitPath.length == 1)
			return null;

		var parentFolderName = splitPath[splitPath.length - 2];
		if (parentFolderName.match(eventFolderRegex))
			return parentFolderName;
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
