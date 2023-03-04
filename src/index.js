import { options } from 'preact'
import { render, createPortal } from 'preact/compat'

let i = 0

export function Reconciler(HostConfig) {
  const id = `preact-fiber-${i++}`

  customElements.define(
    id,
    class extends HTMLElement {
      setAttribute(name, value) {
        if (name === '__vnode') this[name] = value
        else return super.setAttribute(name, value)
      }
      appendChild(child) {
        if (!this.__vnode) {
          HostConfig.appendChildToContainer(this.__containerInfo, child.__vnode.__instance)
        } else {
          HostConfig.appendChild(this.__vnode.__instance, child.__vnode.__instance)
        }
        return super.appendChild(child)
      }

      insertBefore(child, beforeChild) {
        if (!this.__vnode) {
          HostConfig.insertInContainerBefore(
            this.__containerInfo,
            child.__vnode.__instance,
            beforeChild.__vnode.__instance,
          )
        } else {
          HostConfig.insertBefore(this.__vnode.__instance, child.__vnode.__instance, beforeChild.__vnode.__instance)
        }
        return super.insertBefore(child, beforeChild)
      }

      removeChild(child) {
        if (!this.__vnode) {
          HostConfig.removeChildFromContainer(this.__containerInfo, child.__vnode.__instance)
        } else {
          HostConfig.removeChild(this.__instance, child.__vnode.__instance)
        }
        return super.removeChild(child)
      }
    },
  )

  const _vnode = options.vnode
  options.vnode = (vnode) => {
    if (typeof vnode.type === 'string') {
      vnode.__type = vnode.type
      vnode.type = id
      vnode.props.__vnode = vnode
    }
    _vnode?.(vnode)
  }

  const _diffed = options.diffed
  options.diffed = (vnode) => {
    if (typeof vnode.type === 'string') {
      let container = vnode.__container
      if (!container) {
        let root = vnode.__
        while (root.__) root = root.__
        container = vnode.__container = root.__c.__P
      }

      if (!container.__containerInfo) {
        vnode.type = vnode.__type
      } else {
        let next = vnode
        while (next) {
          const node = next
          if (typeof node.type === 'string' && !node.__instance) {
            node.__instance = HostConfig.createInstance(node.__type, node.props)
            let ref = node.ref
            Object.defineProperty(node, 'ref', {
              get() {
                return ref
              },
              set(value) {
                ref = (self) => {
                  const publicInstance = self === null ? null : HostConfig.getPublicInstance(node.__instance)
                  if (value && 'current' in value) value.current = publicInstance
                  else value?.(publicInstance)
                }
              },
            })
            node.ref = ref
          }
          next = next.__
        }

        if (vnode.__oldProps) {
          const payload = HostConfig.prepareUpdate(instance, vnode.__type, vnode.__oldProps, vnode.props)
          if (payload) {
            const replacement = HostConfig.commitUpdate(instance, payload, vnode.__type, vnode.__oldProps, vnode.props)
            if (replacement) {
              vnode.__instance = replacement
              if (vnode.ref && 'current' in vnode.ref) vnode.ref.current = replacement
              else vnode.ref?.(replacement)
            }
          }
        }
        vnode.__oldProps = { ...vnode.props }
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
