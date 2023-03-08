import {
  type VNode,
  type Component,
  type ComponentChildren,
  type ComponentChild,
  type Options,
  options as _options,
  render,
} from 'preact'

interface FiberNode<T = any> extends HTMLElement {
  ownerSVGElement?: null
  fiber?: Fiber
  containerInfo: T
  hostConfig: HostConfig
}

export interface Fiber<P = any, I = any, R = any> extends VNode<P> {
  __c?: Component & {
    __P: FiberNode<R>
  }
  __e: FiberNode<R>
  __: Fiber
  __type?: string
  stateNode?: I
  type: string
  container: FiberNode<R>
  props: P & { children: ComponentChildren }
  memoizedProps?: P & { children: ComponentChildren }
}

export interface HostConfig<
  Type = string,
  Props = Record<string, any>,
  Container = any,
  Instance = any,
  TextInstance = any,
  PublicInstance = any,
  HostContext = any,
  UpdatePayload = any,
> {
  createInstance(
    type: Type,
    props: Props,
    rootContainer: Container,
    hostContext: HostContext,
    internalHandle: Fiber<Props, Instance, Container>,
  ): Instance
  // createTextInstance(
  //   text: string,
  //   rootContainer: Container,
  //   hostContext: HostContext,
  //   internalHandle: Fiber<Props, Instance, Container>,
  // ): TextInstance
  // appendInitialChild(parent: Instance, child: Instance | TextInstance): void
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
  // prepareForCommit(containerInfo: Container): Record<string, any> | null
  // resetAfterCommit(containerInfo: Container): void
  // preparePortalMount(containerInfo: Container): void
  appendChild?(parent: Instance, child: Instance | TextInstance): void
  appendChildToContainer?(container: Container, child: Instance | TextInstance): void
  insertBefore?(parent: Instance, child: Instance | TextInstance, beforeChild: Instance | TextInstance): void
  insertInContainerBefore?(
    container: Container,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ): void
  removeChild?(parent: Instance, child: Instance | TextInstance): void
  removeChildFromContainer?(container: Container, child: Instance | TextInstance): void
  // resetTextContent?(instance: Instance): void
  // commitTextUpdate?(textInstance: TextInstance, oldText: string, newText: string): void
  commitMount?(instance: Instance, type: Type, props: Props, internalHandle: Fiber<Props, Instance, Container>): void
  commitUpdate?(
    instance: Instance,
    updatePayload: UpdatePayload,
    type: Type,
    prevProps: Props,
    nextProps: Props,
    internalHandle: Fiber<Props, Instance, Container>,
  ): void
  // hideInstance?(instance: Instance): void
  // hideTextInstance?(textInstance: TextInstance): void
  // unhideInstance?(instance: Instance, props: Props): void
  // unhideTextInstance?(textInstance: TextInstance, text: string): void
  // clearContainer?(container: Container): void
  [name: string]: unknown
}

// Creates an HTMLNode proxy for reconciliation
class FiberNode extends HTMLElement {
  setAttribute(name: string, value: any): void {
    ;(this as Record<string, unknown>)[name] = value

    // Commit and reconcile props
    const fiber = this.fiber
    if (fiber?.__type) {
      const container = fiber.container
      const HostConfig = (this.hostConfig ??= container.hostConfig)
      const containerInfo = container.containerInfo
      fiber.props[name] = value

      if (fiber.stateNode) {
        const update = HostConfig.prepareUpdate(
          fiber.stateNode,
          fiber.__type,
          fiber.memoizedProps,
          fiber.props,
          containerInfo,
          null,
        )
        // A payload was specified, update instance
        if (update)
          HostConfig.commitUpdate!(fiber.stateNode, update, fiber.__type, fiber.memoizedProps, fiber.props, fiber)
      } else {
        // Cleanup overrides
        this.ownerSVGElement = null
        // @ts-ignore
        fiber.type = typeof IS_REACT_ACT_ENVIRONMENT === 'undefined' ? fiber.__type : 'svg'
        delete fiber.props.fiber

        // Create Fiber instance
        fiber.memoizedProps = { ...fiber.props }
        fiber.stateNode = HostConfig.createInstance(fiber.__type, fiber.props, containerInfo, null, fiber)

        // Narrow ref as per reconciler's public instance
        let ref = fiber.ref
        Object.defineProperty(fiber, 'ref', {
          get() {
            return ref
          },
          set(value) {
            ref = (self) => {
              const publicInstance = self === null ? null : HostConfig.getPublicInstance(fiber.stateNode)
              if (value && 'current' in value) value.current = publicInstance
              else value?.(publicInstance)
            }
          },
        })
        fiber.ref = ref

        // Finalize and commit instance
        const pending = HostConfig.finalizeInitialChildren(
          fiber.stateNode,
          fiber.__type,
          fiber.props,
          containerInfo,
          null,
        )
        if (pending) HostConfig.commitMount!(fiber.stateNode, fiber.__type, fiber.props, fiber)
      }

      fiber.memoizedProps[name] = value
    }
  }
  appendChild<T extends Node>(node: T): T {
    const child = node as unknown as FiberNode
    if (this.fiber) {
      this.hostConfig.appendChild!(this.fiber.stateNode, child.fiber!.stateNode)
    } else {
      this.hostConfig.appendChildToContainer!(this.containerInfo, child.fiber!.stateNode)
    }
    return super.appendChild(node)
  }
  insertBefore<T extends Node>(node: T, beforeNode: Node | null): T {
    const child = node as unknown as FiberNode
    const beforeChild = beforeNode as unknown as FiberNode
    if (this.fiber) {
      this.hostConfig.insertBefore!(this.fiber.stateNode, child.fiber!.stateNode, beforeChild.fiber!.stateNode)
    } else {
      this.hostConfig.insertInContainerBefore!(this.containerInfo, child.fiber!.stateNode, beforeChild.fiber!.stateNode)
    }
    return super.insertBefore(node, beforeNode)
  }
  removeChild<T extends Node>(node: T): T {
    const child = node as unknown as FiberNode
    if (this.fiber) {
      this.hostConfig.removeChild!(this.fiber.stateNode, child.fiber!.stateNode)
    } else {
      this.hostConfig.removeChildFromContainer!(this.containerInfo, child.fiber!.stateNode)
    }
    return super.removeChild(node)
  }
}

let id!: string

interface InternalOptions extends Options {
  /** Attach a hook that is invoked before render, mainly to check the arguments. */
  __(vnode: VNode, parent: HTMLElement): void // _root
  /** Attach a hook that is invoked before a vnode is diffed. */
  __b(vnode: VNode): void // _diff
  /** Attach a hook that is invoked after a tree was mounted or was updated. */
  __c?(vnode: VNode, commitQueue: Component[]): void // _commit
  /** Attach a hook that is invoked before a vnode has rendered. */
  __r(vnode: VNode): void // _render
  /** Attach a hook that is invoked before a hook's state is queried. */
  __h(component: Component, index: number, type: number): void // _hook
  /** Bypass effect execution. Currenty only used in devtools for hooks inspection */
  __s?: boolean // _skipEffects
  /** Attach a hook that is invoked after an error is caught in a component but before calling lifecycle hooks */
  __e(error: any, vnode: VNode, oldVNode?: VNode, errorInfo?: { componentStack?: string }): void // _catchError
}
const options = _options as InternalOptions

export interface Reconciler {
  createContainer<T>(containerInfo: T): FiberNode<T>
  updateContainer<T>(element: ComponentChild, container: FiberNode<T>): void
  createPortal(children: ComponentChild, containerInfo: any, implementation: any, key?: string | null): void
  injectIntoDevTools(devToolsConfig: any): any
}

export default (hostConfig: HostConfig): Reconciler => {
  // Inject custom reconciler runtime
  if (!id) {
    customElements.define((id = 'preact-reconciler'), FiberNode)

    // Link managed nodes on first run
    const DIFF = options.__b
    options.__b = (vnode) => {
      const fiber = vnode as Partial<Fiber>
      if (typeof fiber.type === 'string' && !fiber.container) {
        // Find root container node
        let root = fiber.__
        while (root?.__) root = root.__
        fiber.container = root?.__c!.__P

        // Root belongs to a reconciler, create a Fiber for it
        if (fiber.container?.hostConfig) {
          fiber.__type = fiber.type
          fiber.type = id
          fiber.props.fiber = fiber
        }
      }
      DIFF?.(vnode)
    }
  }

  return {
    createContainer(containerInfo) {
      const container = new FiberNode()
      container.containerInfo = containerInfo
      container.hostConfig = hostConfig
      return container
    },
    updateContainer(element, container): void {
      render(element, container)
    },
    createPortal() {},
    injectIntoDevTools() {},
  }
}
