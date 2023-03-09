type Fiber = any
type SuspenseInstance = any
type Container = any
type ReactComponent = any

export const getNearestMountedFiber = (_fiber: Fiber): Fiber | null => null
export const getSuspenseInstanceFromFiber = (_fiber: Fiber): SuspenseInstance | null => null
export const getContainerFromFiber = (_fiber: Fiber): Container | null => null
export const isFiberMounted = (_fiber: Fiber): boolean => false
export const isMounted = (_component: ReactComponent): boolean => false
export const findCurrentFiberUsingSlowPath = (_fiber: Fiber): Fiber | null => null
export const findCurrentHostFiber = (_parent: Fiber): Fiber | null => null
export const findCurrentHostFiberWithNoPortals = (_parent: Fiber): Fiber | null => null
export const isFiberSuspenseAndTimedOut = (_fiber: Fiber): boolean => false
export const doesFiberContain = (_parentFiber: Fiber, _childFiber: Fiber): boolean => false
