import * as React from 'preact/compat'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
  } else if (typeof child.props.attach === 'function') {
    child.object.__previousAttach = child.props.attach(parent.object, child.object)
  }
}

function detach(parent, child) {
  if (typeof child.props.attach === 'string') {
    const { root, key } = resolve(parent.object, child.props.attach)
    root[key] = child.object.__previousAttach
  } else if (typeof child.props.attach === 'function') {
    child.object.__previousAttach(parent.object, child.object)
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

const catalogue = THREE

export const extend = (objects) => void Object.assign(catalogue, objects)

const reconciler = Reconciler({
  createInstance(type, { args = [], object = new THREE[type[0].toUpperCase() + type.slice(1)](...args), ...props }) {
    if (props.attach === undefined) {
      if (object.isMaterial) props.attach = 'material'
      else if (object.isBufferGeometry) props.attach = 'geometry'
    }

    applyProps(object, props)

    return { type, object, props: { args, ...props } }
  },
  prepareUpdate(instance, type, oldProps, newProps) {
    if (instance.type && oldProps.object !== newProps.object) return true
    if (oldProps.args.length !== newProps.args.length || newProps.args.some((v, i) => v !== oldProps.args[i]))
      return true

    let changed = false

    const props = {}
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        props[key] = newProps[key]
        changed ||= true
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
    child.object.traverse((node) => node.dispose?.())
    delete child.object
  },
  removeChildFromContainer(container, child) {
    this.removeChild({ object: container.scene }, child)
  },
})

function createRoot(canvas) {
  THREE.ColorManagement.enabled = true

  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  gl.outputEncoding = THREE.sRGBEncoding
  gl.toneMapping = THREE.ACESFilmicToneMapping

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight)
  camera.position.z = 5

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true

  const scene = new THREE.Scene()

  const handleResize = () => {
    gl.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', handleResize)
  handleResize()

  gl.setAnimationLoop(() => {
    controls.update()
    gl.render(scene, camera)
  })

  const root = reconciler.createContainer({ gl, camera, scene })

  return {
    render(element) {
      return reconciler.updateContainer(element, root)
    },
    unmount() {
      return reconciler.updateContainer(null, root, null, () => gl.setAnimationLoop(null))
    },
  }
}

createRoot(canvas).render(
  <mesh>
    <boxGeometry />
    <meshNormalMaterial />
  </mesh>,
)
