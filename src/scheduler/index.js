export const unstable_ImmediatePriority = 1
export const unstable_UserBlockingPriority = 2
export const unstable_NormalPriority = 3
export const unstable_LowPriority = 4
export const unstable_IdlePriority = 5

export const unstable_runWithPriority = (_priority, callback) => callback()
export const unstable_scheduleCallback = (_priority, callback) => callback()
export const unstable_now = performance.now.bind(performance)
