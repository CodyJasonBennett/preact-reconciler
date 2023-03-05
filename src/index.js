import { options } from 'preact'
import { render, createPortal } from 'preact/compat'

let i = 0

export function Reconciler(HostConfig) {
  const id = `preact-fiber-${i++}`

  // Creates an HTMLNode proxy for reconciliation
  class PreactFiber extends HTMLElement {
    setAttribute(name, value) {
      if (name === '__vnode') this[name] = value
    }
    removeAttribute() {}
    addEventListener() {}
    removeEventListener() {}
    appendChild(child) {
      if (!this.__vnode) {
        HostConfig.appendChildToContainer(this.__containerInfo, child.__vnode.stateNode)
      } else {
        HostConfig.appendChild(this.__vnode.stateNode, child.__vnode.stateNode)
      }
      return super.appendChild(child)
    }
    insertBefore(child, beforeChild) {
      if (!this.__vnode) {
        HostConfig.insertInContainerBefore(this.__containerInfo, child.__vnode.stateNode, beforeChild.__vnode.stateNode)
      } else {
        HostConfig.insertBefore(this.__vnode.stateNode, child.__vnode.stateNode, beforeChild.__vnode.stateNode)
      }
      return super.insertBefore(child, beforeChild)
    }
    removeChild(child) {
      if (!this.__vnode) {
        HostConfig.removeChildFromContainer(this.__containerInfo, child.__vnode.stateNode)
      } else {
        HostConfig.removeChild(this.stateNode, child.__vnode.stateNode)
      }
      return super.removeChild(child)
    }
  }
  customElements.define(id, PreactFiber)

  const _vnode = options.vnode
  options.vnode = (vnode) => {
    // Render all elements as PreactFiber, we'll release any unmanaged nodes later
    if (typeof vnode.type === 'string') {
      vnode.__type = vnode.type
      vnode.type = id
      vnode.props.__vnode = vnode
    }
    _vnode?.(vnode)
  }

  const _diffed = options.diffed
  options.diffed = (vnode) => {
    if (vnode.__type && vnode.__e instanceof PreactFiber) {
      // On first run, find the nearest container if able
      let container = vnode.__container
      if (!container) {
        let root = vnode.__
        while (root.__) root = root.__
        container = vnode.__container = root.__c.__P
      }

      if (!container.__containerInfo) {
        // Release unmanaged nodes
        vnode.__e = document.createElement(vnode.__type)
      } else {
        // Create and link managed nodes
        let next = vnode
        while (next) {
          const node = next
          if (node.__type && !node.stateNode) {
            node.stateNode = HostConfig.createInstance(node.__type, node.props)
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

        // On subsequent runs, reconcile props
        if (vnode.memoizedProps) {
          const payload = HostConfig.prepareUpdate(instance, vnode.__type, vnode.memoizedProps, vnode.props)
          if (payload) {
            const replacement = HostConfig.commitUpdate(
              instance,
              payload,
              vnode.__type,
              vnode.memoizedProps,
              vnode.props,
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
    }

    _diffed?.(vnode)
  }

  return {
    createContainer(__containerInfo) {
      return Object.assign(document.createElement(id), { __containerInfo })
    },
    updateContainer(element, root, _, callback) {
      return render(element, root, callback)
    },
    createPortal(...args) {
      return createPortal(...args)
    },
  }
}

export default Reconciler
