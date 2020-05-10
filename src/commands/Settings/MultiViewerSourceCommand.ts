import { WritableCommand, DeserializedCommand } from '../CommandBase'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'
import { MultiViewerSourceState } from '../../state/settings'

export class MultiViewerSourceCommand extends WritableCommand<MultiViewerSourceState> {
	public static readonly rawName = 'CMvI'

	public readonly multiViewerId: number

	constructor (multiviewerId: number) {
		super()

		this.multiViewerId = multiviewerId
	}

	public serialize () {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt8(this.properties.windowIndex || 0, 1)
		buffer.writeUInt16BE(this.properties.source || 0, 2)
		return buffer
	}
}

export class MultiViewerSourceUpdateCommand extends DeserializedCommand<MultiViewerSourceState> {
	public static readonly rawName = 'MvIn'

	public readonly multiViewerId: number

	constructor (multiviewerId: number, properties: MultiViewerSourceState) {
		super(properties)

		this.multiViewerId = multiviewerId
	}

	public static deserialize (rawCommand: Buffer): MultiViewerSourceUpdateCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const properties = {
			source: rawCommand.readUInt16BE(2),
			windowIndex: rawCommand.readUInt8(1)
		}

		return new MultiViewerSourceUpdateCommand(multiViewerId, properties)
	}

	public applyToState (state: AtemState) {
		if (!state.info.multiviewer || this.multiViewerId >= state.info.multiviewer.count) {
			throw new InvalidIdError('MultiViewer', this.multiViewerId)
		}

		const multiviewer = AtemStateUtil.getMultiViewer(state, this.multiViewerId)
		multiviewer.windows[this.properties.windowIndex] = {
			...multiviewer.windows[this.properties.windowIndex],
			...this.properties
		}

		return `settings.multiViewers.${this.multiViewerId}.windows.${this.properties.windowIndex}`
	}
}