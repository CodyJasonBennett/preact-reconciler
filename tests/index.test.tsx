import { vi, it, expect } from 'vitest'
import * as React from 'react'
import Reconciler from 'react-reconciler'
import { DefaultEventPriority, ConcurrentRoot } from 'react-reconciler/constants'
import { suspend } from 'suspend-react'
import { act } from 'preact/test-utils'

interface ReconcilerNode<P = Record<string, unknown>> {
  type: string
  props: P
  children: ReconcilerNode[]
}

interface HostContainer {
  head: ReconcilerNode | null
}

interface HostConfig {
  type: string
  props: Record<string, unknown>
  container: HostContainer
  instance: ReconcilerNode
  textInstance: ReconcilerNode
  suspenseInstance: ReconcilerNode
  hydratableInstance: never
  publicInstance: null
  hostContext: null
  updatePayload: {}
  childSet: never
  timeoutHandle: number
  noTimeout: -1
}

// react-reconciler exposes some sensitive props. We don't want them exposed in public instances
const REACT_INTERNAL_PROPS = ['ref', 'key', 'children']
function getInstanceProps(props: Reconciler.Fiber['pendingProps']): HostConfig['props'] | null {
  let instanceProps: HostConfig['props'] | null = null

  for (const key in props) {
    if (REACT_INTERNAL_PROPS.includes(key)) continue
    instanceProps ??= {}
    instanceProps[key] = props[key]
  }

  return instanceProps
}

const reconciler = Reconciler<
  HostConfig['type'],
  HostConfig['props'],
  HostConfig['container'],
  HostConfig['instance'],
  HostConfig['textInstance'],
  HostConfig['suspenseInstance'],
  HostConfig['hydratableInstance'],
  HostConfig['publicInstance'],
  HostConfig['hostContext'],
  HostConfig['updatePayload'],
  HostConfig['childSet'],
  HostConfig['timeoutHandle'],
  HostConfig['noTimeout']
>({
  isPrimaryRenderer: false,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  now: Date.now,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  createInstance: (type, props) => ({ type, props: getInstanceProps(props)!, children: [] }),
  hideInstance() {},
  unhideInstance() {},
  createTextInstance: (value) => ({ type: 'text', props: { value }, children: [] }),
  hideTextInstance() {},
  unhideTextInstance() {},
  appendInitialChild: (parent, child) => parent.children.push(child),
  appendChild: (parent, child) => parent.children.push(child),
  appendChildToContainer: (container, child) => (container.head = child),
  insertBefore: (parent, child, beforeChild) => parent.children.splice(parent.children.indexOf(beforeChild), 0, child),
  insertInContainerBefore: (container, child) => (container.head = child),
  removeChild: (parent, child) => parent.children.splice(parent.children.indexOf(child), 1),
  removeChildFromContainer: (container, child) => void (container.head === child && (container.head = null)),
  getPublicInstance: () => null,
  getRootHostContext: () => null,
  getChildHostContext: () => null,
  shouldSetTextContent: () => false,
  finalizeInitialChildren: () => false,
  prepareUpdate: (_instance, _type, _oldProps, newProps) => getInstanceProps(newProps),
  commitUpdate: (instance, props) => void (instance.props = props),
  commitTextUpdate: (instance, _, value) => (instance.props.value = value),
  prepareForCommit: () => null,
  resetAfterCommit() {},
  preparePortalMount() {},
  clearContainer: (container) => (container.head = null),
  // @ts-ignore
  getCurrentEventPriority: () => DefaultEventPriority,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  detachDeletedInstance: () => {},
})

reconciler.injectIntoDevTools({
  findFiberByHostInstance: () => null,
  bundleType: 0,
  version: React.version,
  rendererPackageName: 'test-renderer',
})

const container: HostContainer = { head: null }
const root = reconciler.createContainer(container, ConcurrentRoot, null, false, null, '', console.error, null)

function render(element: React.ReactNode): HostContainer {
  reconciler.updateContainer(element, root, null, undefined)
  return container
}

function createPortal(element: React.ReactNode, container: HostContainer): JSX.Element {
  return <>{reconciler.createPortal(element, container, null, null)}</>
}

// Mock scheduler to test React features
vi.mock('scheduler', () => require('scheduler/unstable_mock'))

interface ReactProps<T> {
  key?: React.Key
  ref?: React.Ref<T>
  children?: React.ReactNode
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      element: ReactProps<null> & Record<string, unknown>
    }
  }
}

it('should go through lifecycle', async () => {
  const lifecycle: string[] = []

  function Test() {
    lifecycle.push('render')
    React.useImperativeHandle(React.useRef(), () => void lifecycle.push('ref'))
    React.useInsertionEffect(() => void lifecycle.push('useInsertionEffect'), [])
    React.useLayoutEffect(() => void lifecycle.push('useLayoutEffect'), [])
    React.useEffect(() => void lifecycle.push('useEffect'), [])
    return null
  }
  let container!: HostContainer
  await act(async () => void (container = render(<Test />)))

  expect(lifecycle).toStrictEqual([
    'render',
    'ref',
    'useInsertionEffect',
    // 'ref', // Preact is supposed to call insertion effects during diffing
    'useLayoutEffect',
    'useEffect',
  ])
  expect(container.head).toBe(null)
})

it.skip('should render JSX', async () => {
  let container!: HostContainer

  // Mount
  await act(async () => void (container = render(<element key={1} foo />)))
  expect(container.head).toStrictEqual({ type: 'element', props: { foo: true }, children: [] })

  // Remount
  await act(async () => void (container = render(<element bar />)))
  expect(container.head).toStrictEqual({ type: 'element', props: { bar: true }, children: [] })

  // Mutate
  await act(async () => void (container = render(<element foo />)))
  expect(container.head).toStrictEqual({ type: 'element', props: { foo: true }, children: [] })

  // Child mount
  await act(async () => {
    container = render(
      <element foo>
        <element />
      </element>,
    )
  })
  expect(container.head).toStrictEqual({
    type: 'element',
    props: { foo: true },
    children: [{ type: 'element', props: {}, children: [] }],
  })

  // Child unmount
  await act(async () => void (container = render(<element foo />)))
  expect(container.head).toStrictEqual({ type: 'element', props: { foo: true }, children: [] })

  // Unmount
  await act(async () => void (container = render(<></>)))
  expect(container.head).toBe(null)

  // Suspense
  const Test = () => (suspend(async () => null, []), (<element bar />))
  await act(async () => void (container = render(<Test />)))
  expect(container.head).toStrictEqual({ type: 'element', props: { bar: true }, children: [] })

  // Portals
  const portalContainer: HostContainer = { head: null }
  await act(async () => void (container = render(createPortal(<element />, portalContainer))))
  expect(container.head).toBe(null)
  expect(portalContainer.head).toStrictEqual({ type: 'element', props: {}, children: [] })
})

it.skip('should render text', async () => {
  let container!: HostContainer

  // Mount
  await act(async () => void (container = render(<>one</>)))
  expect(container.head).toStrictEqual({ type: 'text', props: { value: 'one' }, children: [] })

  // Remount
  await act(async () => void (container = render(<>one</>)))
  expect(container.head).toStrictEqual({ type: 'text', props: { value: 'one' }, children: [] })

  // Mutate
  await act(async () => void (container = render(<>two</>)))
  expect(container.head).toStrictEqual({ type: 'text', props: { value: 'two' }, children: [] })

  // Unmount
  await act(async () => void (container = render(<></>)))
  expect(container.head).toBe(null)

  // Suspense
  const Test = () => (suspend(async () => null, []), (<>three</>))
  await act(async () => void (container = render(<Test />)))
  expect(container.head).toStrictEqual({ type: 'text', props: { value: 'three' }, children: [] })

  // Portals
  const portalContainer: HostContainer = { head: null }
  await act(async () => void (container = render(createPortal('four', portalContainer))))
  expect(container.head).toBe(null)
  expect(portalContainer.head).toStrictEqual({ type: 'text', props: { value: 'four' }, children: [] })
})
