import { options } from 'preact'
import { render, createPortal } from 'preact/compat'

// Creates an HTMLNode proxy for reconciliation
class PreactFiber extends HTMLElement {
  get _HostConfig() {
    return this.__hostConfig ?? this.__vnode?.__container?.__hostConfig
  }
  setAttribute(name, value) {
    if (name === '__vnode') this[name] = value
  }
  removeAttribute() {}
  addEventListener() {}
  removeEventListener() {}
  appendChild(child) {
    if (this.__vnode) {
      this._HostConfig.appendChild(this.__vnode.stateNode, child.__vnode.stateNode)
    } else {
      this._HostConfig.appendChildToContainer(this.__containerInfo, child.__vnode.stateNode)
    }
    return super.appendChild(child)
  }
  insertBefore(child, beforeChild) {
    if (this.__vnode) {
      this._HostConfig.insertBefore(this.__vnode.stateNode, child.__vnode.stateNode, beforeChild.__vnode.stateNode)
    } else {
      this._HostConfig.insertInContainerBefore(
        this.__containerInfo,
        child.__vnode.stateNode,
        beforeChild.__vnode.stateNode,
      )
    }
    return super.insertBefore(child, beforeChild)
  }
  removeChild(child) {
    if (this.__vnode) {
      this._HostConfig.removeChild(this.stateNode, child.__vnode.stateNode)
    } else {
      this._HostConfig.removeChildFromContainer(this.__containerInfo, child.__vnode.stateNode)
    }
    return super.removeChild(child)
  }
}

export function Reconciler(__hostConfig) {
  // Inject custom reconciler runtime
  if (!customElements.get('preact-fiber')) {
    customElements.define('preact-fiber', PreactFiber)

    const _diff = options.__b
    options.__b = (vnode) => {
      // On first run, link managed nodes
      if (typeof vnode.type === 'string') {
        let container = vnode.__container
        if (!container) {
          let root = vnode.__
          while (root.__) root = root.__
          container = vnode.__container = root.__c.__P

          if (container.__hostConfig) {
            vnode.__type = vnode.type
            vnode.type = 'preact-fiber'
            vnode.props.__vnode = vnode
          }
        }
      }
      _diff?.(vnode)
    }

    const _diffed = options.diffed
    options.diffed = (vnode) => {
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

        if (!vnode.memoizedProps) {
          // On first run, finalize instance
          const pending = HostConfig.finalizeInitialChildren(vnode.stateNode, vnode.type, vnode.props, containerInfo)
          if (pending) HostConfig.commitMount(vnode.stateNode, vnode.type, vnode.props, vnode)
        } else {
          // On subsequent runs, reconcile props
          const payload = HostConfig.prepareUpdate(
            vnode.stateNode,
            vnode.type,
            vnode.memoizedProps,
            vnode.props,
            containerInfo,
            null,
          )

          // A payload was specified, update instance
          if (payload) {
            const replacement = HostConfig.commitUpdate(
              vnode.stateNode,
              payload,
              vnode.type,
              vnode.memoizedProps,
              vnode.props,
              vnode,
            )

            // If commitUpdate returns an instance, swap to it
            if (replacement) {
              vnode.stateNode = replacement
              if (vnode.ref && 'current' in vnode.ref) vnode.ref.current = replacement
              else vnode.ref?.(replacement)
            }
          }
        }
        vnode.memoizedProps = { ...vnode.props }
      }
      _diffed?.(vnode)
    }
  }

  return {
    createContainer(__containerInfo) {
      return Object.assign(document.createElement('preact-fiber'), { __containerInfo, __hostConfig })
    },
    updateContainer(element, root, _, callback) {
      return render(element, root, callback)
    },
    createPortal(...args) {
      return createPortal(...args)
    },
    injectIntoDevTools() {},
  }
}

export default Reconciler
