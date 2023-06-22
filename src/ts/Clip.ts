import Enumerable = require('linq');
import { Cameras, TeslaCamEvent, VideoEntryTypes, VideoSegment } from "./Models";
import { VideoFile } from "./VideoFile";


export default class Clip {
	public eventFolderName: string;
	public type: VideoEntryTypes | null;
	public startDate: Date;
	public totalDurationInSeconds: number | null;
	public videoSegments: Enumerable.IEnumerable<VideoSegment>;
	public teslaCamEvent: TeslaCamEvent|null = null;

	constructor(videoFiles: VideoFile[], teslaCamEvent: TeslaCamEvent) {
		const enumerableVideoFiles = Enumerable.from(videoFiles);

		this.eventFolderName = enumerableVideoFiles.first().eventFolderName;
		this.type = enumerableVideoFiles.first().type;
		this.startDate = enumerableVideoFiles.minBy(v => v.startDate).startDate;
		// this.totalDurationInSeconds = Enumerable.from(videoFiles).where(v => v.camera === Cameras.Front).sum(v => v.durationInSeconds + 1.5);
		this.totalDurationInSeconds = (enumerableVideoFiles.max(v => v.endDate.getTime()) - enumerableVideoFiles.min(v => v.startDate.getTime())) / 1000;
		this.videoSegments = Enumerable.from(Clip.loadVideoSegments(videoFiles));
		this.teslaCamEvent = teslaCamEvent;
	}

	private static loadVideoSegments(videoFiles: VideoFile[]) : VideoSegment[] {
		return Enumerable
			.from(videoFiles)
			.where(v => !!v.durationInSeconds)
			.orderBy(v => v.startDate)
			.groupBy(v => v.startDate.getTime())
			.select(g => new VideoSegment(g.first().startDate, g.toArray()))
			.toArray();
	}

	public getSegmentAtDate(date: Date): VideoSegment|null {
		return this.videoSegments.firstOrDefault(s => s.startDate <= date && s.endDate >= date);
	}
}