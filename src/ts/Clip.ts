import Enumerable = require('linq');
import { Cameras, TeslaCamEvent, VideoEntryTypes } from "./Models";
import { VideoFile } from "./VideoFile";

export default class Clip {
	public eventFolderName: string;
	public type: VideoEntryTypes | null;
	public date: Date;
	public totalDurationInSeconds: number | null;
	public videoSegments: Enumerable.IDictionary<Date, VideoFile[]>;
	public teslaCamEvent: TeslaCamEvent;

	constructor(videoEntries: VideoFile[], teslaCamEvent: TeslaCamEvent) {
		this.eventFolderName = videoEntries[0].eventFolderName;
		this.type = videoEntries[0].type;
		this.date = Enumerable.from(videoEntries).minBy(v => v.startDate).startDate;
		this.totalDurationInSeconds = Enumerable.from(videoEntries).where(v => v.camera === Cameras.Front).sum(v => v.durationInSeconds);
		this.videoSegments = Enumerable
			.from(videoEntries)
			.where(v => !!v.durationInSeconds)
			.orderBy(v => v.startDate)
			.groupBy(v => v.startDate.getTime())
			.toDictionary(v => v.first().startDate, v => v.toArray());
		this.teslaCamEvent = teslaCamEvent;
	}
}