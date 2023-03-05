const SyncLane = 0b0000000000000000000000000000010
const InputContinuousLane = 0b0000000000000000000000000001000
const DefaultLane = 0b0000000000000000000000000100000
const IdleLane = 0b0100000000000000000000000000000

export const DiscreteEventPriority = SyncLane
export const ContinuousEventPriority = InputContinuousLane
export const DefaultEventPriority = DefaultLane
export const IdleEventPriority = IdleLane

export const LegacyRoot = 0
export const ConcurrentRoot = 1
