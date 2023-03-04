import * as React from 'preact/compat'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Reconciler from '../src'

const reconciler = Reconciler({
  createInstance(
    type,
    { key, ref, children, args = [], object = new THREE[type[0].toUpperCase() + type.slice(1)](...args), ...props },
  ) {
    Object.assign(object, props)
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
    else Object.assign(instance.object, payload)
  },
  getPublicInstance(instance) {
    return instance.object
  },
  appendChild(parent, child) {
    if (child.props.attach === undefined) {
      if (child.object.isMaterial) child.props.attach = 'material'
      else if (child.object.isBufferGeometry) child.props.attach = 'geometry'
    }

    if (child.props.attach) {
      parent.object[child.props.attach] = child.object
    } else if (parent.object.isObject3D && child.object.isObject3D) {
      parent.object.add(child.object)
    }
  },
  appendChildToContainer(container, child) {
    this.appendChild({ object: container.scene }, child)
  },
  insertBefore(parent, child, beforeChild) {},
  insertInContainerBefore(container, child, beforeChild) {
    this.insertBefore({ object: container.scene }, child, beforeChild)
  },
  removeChild(parent, child) {
    if (child.props.attach) {
      delete parent.object[child.props.attach]
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
  const gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })

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
