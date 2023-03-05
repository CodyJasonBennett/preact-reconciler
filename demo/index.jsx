import * as React from 'preact/compat'
import * as THREE from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
import Reconciler from '../src'

function resolve(root, key) {
  let target = root[key]
  if (!key.includes('-')) return { root, key, target }

  const chain = key.split('-')
  target = chain.reduce((acc, key) => acc[key], root)
  key = chain.pop()

  if (!target?.set) root = chain.reduce((acc, key) => acc[key], root)

  return { root, key, target }
}

const INDEX_REGEX = /-\d+$/

function attach(parent, child) {
  if (typeof child.props.attach === 'string') {
    if (INDEX_REGEX.test(child.props.attach)) {
      const target = child.props.attach.replace(INDEX_REGEX, '')
      const { root, key } = resolve(parent.object, target)
      if (!Array.isArray(root[key])) root[key] = []
    }

    const { root, key } = resolve(parent.object, child.props.attach)
    child.object.__previousAttach = root[key]
    root[key] = child.object
  } else {
    child.object.__previousAttach = child.props.attach?.(parent.object, child.object)
  }
}

function detach(parent, child) {
  if (typeof child.props.attach === 'string') {
    const { root, key } = resolve(parent.object, child.props.attach)
    root[key] = child.object.__previousAttach
  } else {
    child.object.__previousAttach?.(parent.object, child.object)
  }
  delete child.object.__previousAttach
}

const RESERVED_PROPS = ['args', 'attach', 'object', 'key', 'ref', 'children', '__vnode']

function applyProps(object, props) {
  for (const prop in props) {
    if (RESERVED_PROPS.includes(prop)) continue

    const value = props[prop]
    const { root, key, target } = resolve(object, prop)

    if (!target?.set) root[key] = value
    else if (target.constructor === value.constructor) target.copy(value)
    else if (Array.isArray(value)) target.set(...value)
    else if (!target.isColor && target.setScalar) target.setScalar(value)
    else target.set(value)
  }
}

const catalogue = {}

export const extend = (objects) => void Object.assign(catalogue, objects)

const reconciler = Reconciler({
  createInstance(type, props) {
    const object = props.object ?? new catalogue[type[0].toUpperCase() + type.slice(1)](...(props.args ?? []))

    if (props.attach === undefined) {
      if (object.isMaterial) props.attach = 'material'
      else if (object.isBufferGeometry) props.attach = 'geometry'
    }

    applyProps(object, props)

    return { type, object, props }
  },
  prepareUpdate(instance, type, oldProps, newProps) {
    if (oldProps.object !== newProps.object) return true
    if (oldProps.args.length !== newProps.args.length || newProps.args.some((v, i) => v !== oldProps.args[i]))
      return true

    let changed = false

    const props = {}
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        props[key] = newProps[key]
        changed = true
      }
    }

    return changed ? props : null
  },
  commitUpdate(instance, payload, type, oldProps, newProps) {
    if (payload === true) return this.createInstance(type, newProps)
    else applyProps(instance.object, payload)
  },
  getPublicInstance(instance) {
    return instance.object
  },
  appendChild(parent, child) {
    if (child.props.attach) {
      attach(parent, child)
    } else if (parent.object.isObject3D && child.object.isObject3D) {
      parent.object.add(child.object)
    }
  },
  appendChildToContainer(container, child) {
    this.appendChild({ object: container.scene }, child)
  },
  insertBefore(parent, child, beforeChild) {
    if (child.props.attach) {
      attach(parent, child)
    } else if (parent.object.isObject3D && child.object.isObject3D) {
      child.object.parent = parent.object
      parent.object.children.splice(parent.children.indexOf(beforeChild.object), 0, child.object)
      child.object.dispatchEvent({ type: 'added' })
    }
  },
  insertInContainerBefore(container, child, beforeChild) {
    this.insertBefore({ object: container.scene }, child, beforeChild)
  },
  removeChild(parent, child) {
    if (child.props.attach) {
      detach(parent, child)
    } else if (parent.object.isObject3D && child.object.isObject3D) {
      parent.object.remove(child.object)
    }

    child.object.dispose?.()
    child.object.traverse?.((node) => node.dispose?.())
    delete child.object
  },
  removeChildFromContainer(container, child) {
    this.removeChild({ object: container.scene }, child)
  },
  finalizeInitialChildren() {},
  commitMount() {},
})

const context = React.createContext(null)

export function createRoot(canvas) {
  THREE.ColorManagement.enabled = true

  const store = { scene: new THREE.Scene(), size: { width: 0, height: 0 }, subscriptions: [] }
  const root = reconciler.createContainer(store)

  return {
    render(element, config) {
      if (!store.gl) {
        store.gl = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          ...config?.gl,
          canvas,
        })
        store.gl.outputEncoding = THREE.sRGBEncoding
        store.gl.toneMapping = THREE.ACESFilmicToneMapping

        store.gl.setAnimationLoop(() => {
          const width = canvas.parentElement?.clientWidth ?? 0
          const height = canvas.parentElement?.clientHeight ?? 0

          if (width !== store.size.width || height !== store.size.height) {
            store.gl.setSize(width, height)
            store.camera.aspect = width / height
            store.camera.updateProjectionMatrix()
            store.size.width = width
            store.size.height = height
          }

          let priority = 0
          for (const ref of store.subscriptions) {
            ref.current(store)
            priority += ref.priority
          }
          if (!priority) store.gl.render(store.scene, store.camera)
        })
      }
      if (config?.gl) applyProps(store.gl, config.gl)

      if (!store.camera) {
        store.camera = new THREE.PerspectiveCamera(75)
        store.camera.position.z = 5
      }
      if (config?.camera) applyProps(store.camera, config.camera)

      return reconciler.updateContainer(<context.Provider value={store}>{element}</context.Provider>, root)
    },
    unmount() {
      return reconciler.updateContainer(null, root, null, () => store.gl.setAnimationLoop(null))
    },
  }
}

export function useStore() {
  return React.useContext(context)
}

export function useThree(selector) {
  const value = useStore()
  return selector ? selector(value) : value
}

export function useFrame(callback, priority = 0) {
  const ref = React.useRef(callback)
  React.useLayoutEffect(() => void (ref.current = callback), [callback])
  React.useLayoutEffect(() => void (ref.priority = priority), [priority])

  const subscriptions = useThree((state) => state.subscriptions)
  React.useLayoutEffect(() => {
    subscriptions.push(ref)
    return () => subscriptions.splice(subscriptions.indexOf(ref), 1)
  }, [subscriptions, priority])
}

export function Canvas({ children, ...props }) {
  const [canvas, setCanvas] = React.useState()
  const root = React.useMemo(() => canvas && createRoot(canvas), [canvas])
  React.useEffect(() => () => root?.unmount(), [root])

  extend(THREE)
  root?.render(children, props)

  return <canvas ref={setCanvas} />
}

function OrbitControls(props) {
  extend({ OrbitControls: OrbitControlsImpl })
  const controls = React.useRef()
  const { camera, gl } = useThree()
  useFrame(() => controls.current.update())
  return <orbitControls enableDamping {...props} ref={controls} args={[camera, gl.domElement]} />
}

React.render(
  <Canvas>
    <OrbitControls />
    <mesh>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  </Canvas>,
  root,
)
