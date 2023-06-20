import { VideoEntryTypes } from "./Enums";
import VideoEntry from "./VideoEntry";

export default class Clip {
	public eventFolderName: string;
	public type: VideoEntryTypes | null;
	public date: Date;
	public totalDurationInSeconds: number | null;

	static create(videoEntries: VideoEntry[]) : Clip {
		return new Clip();
	}
}