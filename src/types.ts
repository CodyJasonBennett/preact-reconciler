import type { VNode, ComponentChild } from 'preact'

interface FiberContainer extends HTMLElement {
  __containerInfo: any
  __hostConfig: any
}

export interface Fiber extends VNode {
  __c: {
    __P: FiberContainer
  }
  __: Fiber
  __type?: string
  __container: FiberContainer
  stateNode?: any
  props: any
  memoizedProps: any
  __e: HTMLElement & {
    __vnode?: Fiber
    __hostConfig: any
    __containerInfo: any
    [key: string]: unknown
  }
}

type Type = string
type Props = Record<string, unknown>
type Container = unknown
type Instance = unknown
type TextInstance = unknown
type PublicInstance = unknown
type HostContext = unknown
type UpdatePayload = unknown

type OpaqueHandle = Fiber
type OpaqueRoot = FiberContainer

export interface HostConfig {
  createInstance(
    type: Type,
    props: Props,
    rootContainer: Container,
    hostContext: HostContext,
    internalHandle: OpaqueHandle,
  ): Instance
  // createTextInstance(
  //   text: string,
  //   rootContainer: Container,
  //   hostContext: HostContext,
  //   internalHandle: OpaqueHandle,
  // ): TextInstance
  // appendInitialChild(parentInstance: Instance, child: Instance | TextInstance): void
  finalizeInitialChildren(
    instance: Instance,
    type: Type,
    props: Props,
    rootContainer: Container,
    hostContext: HostContext,
  ): boolean
  prepareUpdate(
    instance: Instance,
    type: Type,
    oldProps: Props,
    newProps: Props,
    rootContainer: Container,
    hostContext: HostContext,
  ): UpdatePayload | null
  // shouldSetTextContent(type: Type, props: Props): boolean
  // getRootHostContext(rootContainer: Container): HostContext | null
  // getChildHostContext(parentHostContext: HostContext, type: Type, rootContainer: Container): HostContext
  getPublicInstance(instance: Instance | TextInstance): PublicInstance
  prepareForCommit(containerInfo: Container): Record<string, any> | null
  resetAfterCommit(containerInfo: Container): void
  // preparePortalMount(containerInfo: Container): void
  appendChild?(parentInstance: Instance, child: Instance | TextInstance): void
  appendChildToContainer?(container: Container, child: Instance | TextInstance): void
  insertBefore?(parentInstance: Instance, child: Instance | TextInstance, beforeChild: Instance | TextInstance): void
  insertInContainerBefore?(
    container: Container,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ): void
  removeChild?(parentInstance: Instance, child: Instance | TextInstance): void
  removeChildFromContainer?(container: Container, child: Instance | TextInstance): void
  // resetTextContent?(instance: Instance): void
  // commitTextUpdate?(textInstance: TextInstance, oldText: string, newText: string): void
  commitMount?(instance: Instance, type: Type, props: Props, internalInstanceHandle: OpaqueHandle): void
  commitUpdate?(
    instance: Instance,
    updatePayload: UpdatePayload,
    type: Type,
    prevProps: Props,
    nextProps: Props,
    internalHandle: OpaqueHandle,
  ): void
  // hideInstance?(instance: Instance): void
  // hideTextInstance?(textInstance: TextInstance): void
  // unhideInstance?(instance: Instance, props: Props): void
  // unhideTextInstance?(textInstance: TextInstance, text: string): void
  // clearContainer?(container: Container): void
}

export interface Reconciler {
  createContainer(containerInfo: any): OpaqueRoot
  createPortal(children: ComponentChild, containerInfo: any, implementation: any, key?: string | null): ComponentChild
  updateContainer(element: ComponentChild, container: OpaqueRoot): void
  injectIntoDevTools(devToolsConfig: any): any
}
