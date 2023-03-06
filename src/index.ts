import { type Options, options as _options, render } from 'preact'
import type { Fiber, HostConfig, Reconciler } from './types'

// Creates an HTMLNode proxy for reconciliation
class PreactFiber extends (HTMLElement as { new (): Fiber['__e'] }) {
  setAttribute(name: string, value: any): void {
    this[name] = value
  }
  appendChild<T extends Node>(node: T): T {
    const child = node as unknown as PreactFiber
    if (this.__vnode) {
      this.__hostConfig.appendChild(this.__vnode.stateNode, child.__vnode!.stateNode)
    } else {
      this.__hostConfig.appendChildToContainer(this.__containerInfo, child.__vnode!.stateNode)
    }
    return super.appendChild(node)
  }
  insertBefore<T extends Node>(node: T, beforeNode: Node | null): T {
    const child = node as unknown as PreactFiber
    const beforeChild = beforeNode as unknown as PreactFiber
    if (this.__vnode) {
      this.__hostConfig.insertBefore(this.__vnode.stateNode, child.__vnode!.stateNode, beforeChild.__vnode!.stateNode)
    } else {
      this.__hostConfig.insertInContainerBefore(
        this.__containerInfo,
        child.__vnode!.stateNode,
        beforeChild.__vnode!.stateNode,
      )
    }
    return super.insertBefore(node, beforeNode)
  }
  removeChild<T extends Node>(node: T): T {
    const child = node as unknown as PreactFiber
    if (this.__vnode) {
      this.__hostConfig.removeChild(this.__vnode.stateNode, child.__vnode!.stateNode)
    } else {
      this.__hostConfig.removeChildFromContainer(this.__containerInfo, child.__vnode!.stateNode)
    }
    return super.removeChild(node)
  }
}

interface InternalOptions extends Options {
  __b: Options['diffed']
}

let id!: string

export default function PreactReconciler(__hostConfig: HostConfig): Reconciler {
  // Inject custom reconciler runtime
  if (!id) {
    customElements.define((id = 'preact-fiber'), PreactFiber)

    const options = _options as InternalOptions

    const _diff = options.__b
    options.__b = (vnode: Fiber) => {
      // On first run, link managed nodes
      if (typeof vnode.type === 'string') {
        let container = vnode.__container
        if (!container) {
          let root = vnode.__
          while (root.__) root = root.__
          container = vnode.__container = root.__c.__P

          const HostConfig = container.__hostConfig
          if (HostConfig) {
            vnode.__type = vnode.type
            vnode.type = id
            vnode.props.__vnode = vnode
            vnode.props.__hostConfig = HostConfig
          }
        }
      }
      _diff?.(vnode)
    }

    const _diffed = options.diffed
    options.diffed = (vnode: Fiber) => {
      // Create and link managed instances
      const container = vnode.__container
      const HostConfig = container?.__hostConfig
      const containerInfo = container?.__containerInfo
      if (HostConfig) {
        // Traverse up and build tree
        let next = vnode
        while (next) {
          const node = next
          if (node.__type && !node.stateNode) {
            node.type = node.__type
            delete node.__type
            delete node.props.__vnode
            delete node.props.__hostConfig
            node.stateNode = HostConfig.createInstance(node.type, node.props, containerInfo, null, vnode)
            let ref = node.ref
            Object.defineProperty(node, 'ref', {
              get() {
                return ref
              },
              set(value) {
                ref = (self) => {
                  const publicInstance = self === null ? null : HostConfig.getPublicInstance(node.stateNode)
                  if (value && 'current' in value) value.current = publicInstance
                  else value?.(publicInstance)
                }
              },
            })
            node.ref = ref
          }
          next = next.__
        }

        // On first run, finalize instance
        if (!vnode.memoizedProps) {
          const pending = HostConfig.finalizeInitialChildren(vnode.stateNode, vnode.type, vnode.props, containerInfo)
          if (pending) HostConfig.commitMount(vnode.stateNode, vnode.type, vnode.props, vnode)
        }

        // Reconcile props
        const update = HostConfig.prepareUpdate(
          vnode.stateNode,
          vnode.type,
          vnode.memoizedProps,
          vnode.props,
          containerInfo,
          null,
        )
        // A payload was specified, update instance
        if (update)
          HostConfig.commitUpdate(vnode.stateNode, update, vnode.type, vnode.memoizedProps, vnode.props, vnode)

        vnode.memoizedProps = { ...vnode.props }
      }
      _diffed?.(vnode)
    }
  }

  return {
    createContainer(__containerInfo) {
      return Object.assign(document.createElement(id), { __containerInfo, __hostConfig })
    },
    updateContainer(element, root) {
      render(element, root)
    },
    createPortal() {
      return null // TODO
    },
    injectIntoDevTools() {},
  }
}

export * from './types'
