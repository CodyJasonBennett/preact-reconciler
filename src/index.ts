import {
  type VNode,
  type Component,
  type ComponentChildren,
  type ComponentChild,
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

    const fiber = this.fiber
    if (fiber) {
      fiber.props[name] = value

      if (!fiber.stateNode) {
        // Cleanup overrides
        this.ownerSVGElement = null
        fiber.type = fiber.__type!

        // Create Fiber instance
        const container = fiber.container
        const HostConfig = (this.hostConfig ??= container.hostConfig)
        const containerInfo = container.containerInfo
        fiber.stateNode = HostConfig.createInstance(fiber.type, fiber.props, containerInfo, null, fiber)

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
      }

      options.diffed?.(fiber)
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

const options = _options as {
  vnode?(fiber: Fiber): void
  unmount?(fiber: Fiber): void
  diffed?(fiber: Fiber): void
  event?(event: Event): any
  requestAnimationFrame?(callback: () => void): void
  debounceRendering?(callback: () => void): void
  useDebugValue?(value: string | number): void
  __h(component: Component, index: number, type: number): void // HOOK
  __b(fiber: Fiber): void // DIFF
  __r(fiber: Fiber): void // RENDER
  __e(error: any, fiber: Fiber, oldFiber: Fiber): void // CATCH_ERROR
}

export default (hostConfig: HostConfig) => {
  // Inject custom reconciler runtime
  if (!id) {
    customElements.define((id = 'preact-fiber'), FiberNode)

    // Link managed nodes on first run
    const DIFF = options.__b
    options.__b = (fiber) => {
      if (typeof fiber.type === 'string') {
        if (!fiber.container) {
          let root = fiber.__
          while (root.__) root = root.__
          fiber.container = root.__c!.__P

          if (fiber.container.hostConfig) {
            fiber.__type = fiber.type
            fiber.type = id
            fiber.props.fiber = fiber
          }
        }
      }
      DIFF?.(fiber)
    }

    // Commit and reconcile props
    const DIFFED = options.diffed
    options.diffed = (fiber) => {
      const container = fiber.container
      const HostConfig = container?.hostConfig
      const containerInfo = container?.containerInfo
      if (HostConfig) {
        // On first run, finalize instance
        if (!fiber.memoizedProps) {
          const pending = HostConfig.finalizeInitialChildren(
            fiber.stateNode,
            fiber.type,
            fiber.props,
            containerInfo,
            null,
          )
          if (pending) HostConfig.commitMount!(fiber.stateNode, fiber.type, fiber.props, fiber)
        } else {
          // On subsequent runs, reconcile props
          const update = HostConfig.prepareUpdate(
            fiber.stateNode,
            fiber.type,
            fiber.memoizedProps,
            fiber.props,
            containerInfo,
            null,
          )
          // A payload was specified, update instance
          if (update)
            HostConfig.commitUpdate!(fiber.stateNode, update, fiber.type, fiber.memoizedProps, fiber.props, fiber)
        }

        fiber.memoizedProps = { ...fiber.props }
      }
      DIFFED?.(fiber)
    }
  }

  return {
    createContainer<T>(containerInfo: T): FiberNode<T> {
      return Object.assign(document.createElement(id), { containerInfo, hostConfig })
    },
    updateContainer<T>(element: ComponentChild, container: FiberNode<T>): void {
      render(element, container)
    },
    createPortal(
      _children: ComponentChild,
      _containerInfo: any,
      _implementation: any,
      _key?: string | null,
    ): ComponentChild {
      return null // TODO
    },
    injectIntoDevTools(_devToolsConfig: any): any {},
  }
}
