import { vi, describe, it, expect } from 'vitest'
import type ReconcilerType from 'react-reconciler'

type React = typeof import('react')
type Reconciler = typeof import('react-reconciler')

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

// Let React know that we'll be testing effectful components
global.IS_REACT_ACT_ENVIRONMENT = true

// Mock scheduler to test React features
vi.mock('scheduler', () => require('scheduler/unstable_mock'))

interface ReactProps<T> {
  key?: React.Key
  ref?: React.Ref<T>
  children?: React.ReactNode
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      element: ReactProps<null> & Record<string, unknown>
    }
  }
}

for (const label of ['react', 'preact']) {
  // Set mocks
  type _React = React
  type _Reconciler = Reconciler
  const React: _React = await import(label === 'react' ? '../node_modules/react' : 'react')
  const Reconciler: _Reconciler = (
    await import(label === 'react' ? '../node_modules/react-reconciler' : 'react-reconciler')
  ).default
  const {
    // NoEventPriority,
    ContinuousEventPriority,
    DiscreteEventPriority,
    DefaultEventPriority,
    ConcurrentRoot,
  } = await import(label === 'react' ? '../node_modules/react-reconciler/constants' : 'react-reconciler/constants')
  const NoEventPriority = 0

  // preact/compat doesn't export React 18 act
  const act = label === 'react' ? React.act : (await import('preact/test-utils')).act

  // TODO: upstream to DefinitelyTyped for React 19
  // https://github.com/facebook/react/issues/28956
  type EventPriority = number

  function createReconciler<
    Type,
    Props,
    Container,
    Instance,
    TextInstance,
    SuspenseInstance,
    HydratableInstance,
    FormInstance,
    PublicInstance,
    HostContext,
    ChildSet,
    TimeoutHandle,
    NoTimeout,
    TransitionStatus,
  >(
    config: Omit<
      ReconcilerType.HostConfig<
        Type,
        Props,
        Container,
        Instance,
        TextInstance,
        SuspenseInstance,
        HydratableInstance,
        PublicInstance,
        HostContext,
        null, // updatePayload
        ChildSet,
        TimeoutHandle,
        NoTimeout
      >,
      'getCurrentEventPriority' | 'prepareUpdate' | 'commitUpdate'
    > & {
      /**
       * This method should mutate the `instance` and perform prop diffing if needed.
       *
       * The `internalHandle` data structure is meant to be opaque. If you bend the rules and rely on its internal fields, be aware that it may change significantly between versions. You're taking on additional maintenance risk by reading from it, and giving up all guarantees if you write something to it.
       */
      commitUpdate?(
        instance: Instance,
        type: Type,
        prevProps: Props,
        nextProps: Props,
        internalHandle: ReconcilerType.OpaqueHandle,
      ): void

      // Undocumented
      // https://github.com/facebook/react/pull/26722
      NotPendingTransition: TransitionStatus | null
      HostTransitionContext: React.Context<TransitionStatus>
      // https://github.com/facebook/react/pull/28751
      setCurrentUpdatePriority(newPriority: EventPriority): void
      getCurrentUpdatePriority(): EventPriority
      resolveUpdatePriority(): EventPriority
      // https://github.com/facebook/react/pull/28804
      resetFormInstance(form: FormInstance): void
      // https://github.com/facebook/react/pull/25105
      requestPostPaintCallback(callback: (time: number) => void): void
      // https://github.com/facebook/react/pull/26025
      shouldAttemptEagerTransition(): boolean
      // https://github.com/facebook/react/pull/31528
      trackSchedulerEvent(): void
      // https://github.com/facebook/react/pull/31008
      resolveEventType(): null | string
      resolveEventTimeStamp(): number

      /**
       * This method is called during render to determine if the Host Component type and props require some kind of loading process to complete before committing an update.
       */
      maySuspendCommit(type: Type, props: Props): boolean
      /**
       * This method may be called during render if the Host Component type and props might suspend a commit. It can be used to initiate any work that might shorten the duration of a suspended commit.
       */
      preloadInstance(type: Type, props: Props): boolean
      /**
       * This method is called just before the commit phase. Use it to set up any necessary state while any Host Components that might suspend this commit are evaluated to determine if the commit must be suspended.
       */
      startSuspendingCommit(): void
      /**
       * This method is called after `startSuspendingCommit` for each Host Component that indicated it might suspend a commit.
       */
      suspendInstance(type: Type, props: Props): void
      /**
       * This method is called after all `suspendInstance` calls are complete.
       *
       * Return `null` if the commit can happen immediately.
       *
       * Return `(initiateCommit: Function) => Function` if the commit must be suspended. The argument to this callback will initiate the commit when called. The return value is a cancellation function that the Reconciler can use to abort the commit.
       *
       */
      waitForCommitToBeReady(): ((initiateCommit: Function) => Function) | null
    },
  ): ReconcilerType.Reconciler<Container, Instance, TextInstance, SuspenseInstance, PublicInstance> {
    const reconciler = Reconciler(config as any)

    reconciler.injectIntoDevTools({
      bundleType: typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ? 1 : 0,
      rendererPackageName: 'react-nil',
      version: React.version,
    })

    return reconciler as any
  }

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
    formInstance: never
    hostContext: {}
    childSet: never
    timeoutHandle: number
    noTimeout: -1
    TransitionStatus: null
  }

  // react-reconciler exposes some sensitive props. We don't want them exposed in public instances
  const REACT_INTERNAL_PROPS = ['ref', 'key', 'children']
  function getInstanceProps(props: Record<string, unknown>): HostConfig['props'] {
    const instanceProps: HostConfig['props'] = {}

    for (const key in props) {
      if (REACT_INTERNAL_PROPS.includes(key)) continue
      instanceProps[key] = props[key]
    }

    return instanceProps
  }

  const NO_CONTEXT: HostConfig['hostContext'] = {}

  let currentUpdatePriority: number = NoEventPriority

  const reconciler = createReconciler<
    HostConfig['type'],
    HostConfig['props'],
    HostConfig['container'],
    HostConfig['instance'],
    HostConfig['textInstance'],
    HostConfig['suspenseInstance'],
    HostConfig['hydratableInstance'],
    HostConfig['formInstance'],
    HostConfig['publicInstance'],
    HostConfig['hostContext'],
    HostConfig['childSet'],
    HostConfig['timeoutHandle'],
    HostConfig['noTimeout'],
    HostConfig['TransitionStatus']
  >({
    isPrimaryRenderer: false,
    warnsIfNotActing: false,
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    createInstance: (type, props) => ({ type, props: getInstanceProps(props), children: [] }),
    hideInstance() {},
    unhideInstance() {},
    createTextInstance: (value) => ({ type: 'text', props: { value }, children: [] }),
    hideTextInstance() {},
    unhideTextInstance() {},
    appendInitialChild: (parent, child) => parent.children.push(child),
    appendChild: (parent, child) => parent.children.push(child),
    appendChildToContainer: (container, child) => (container.head = child),
    insertBefore: (parent, child, beforeChild) =>
      parent.children.splice(parent.children.indexOf(beforeChild), 0, child),
    removeChild: (parent, child) => parent.children.splice(parent.children.indexOf(child), 1),
    removeChildFromContainer: (container) => (container.head = null),
    getPublicInstance: () => null,
    getRootHostContext: () => NO_CONTEXT,
    getChildHostContext: () => NO_CONTEXT,
    shouldSetTextContent: () => false,
    finalizeInitialChildren: () => false,
    commitUpdate: (instance, _type, _prevProps, nextProps) => (instance.props = getInstanceProps(nextProps)),
    commitTextUpdate: (instance, _, value) => (instance.props.value = value),
    prepareForCommit: () => null,
    resetAfterCommit() {},
    preparePortalMount() {},
    clearContainer: (container) => (container.head = null),
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur() {},
    afterActiveInstanceBlur() {},
    detachDeletedInstance() {},
    prepareScopeUpdate() {},
    getInstanceFromScope: () => null,
    shouldAttemptEagerTransition: () => false,
    trackSchedulerEvent: () => {},
    resolveEventType: () => null,
    resolveEventTimeStamp: () => -1.1,
    requestPostPaintCallback() {},
    maySuspendCommit: () => false,
    preloadInstance: () => true, // true indicates already loaded
    startSuspendingCommit() {},
    suspendInstance() {},
    waitForCommitToBeReady: () => null,
    NotPendingTransition: null,
    HostTransitionContext: /* @__PURE__ */ React.createContext<HostConfig['TransitionStatus']>(null),
    setCurrentUpdatePriority(newPriority: number) {
      currentUpdatePriority = newPriority
    },
    getCurrentUpdatePriority() {
      return currentUpdatePriority
    },
    resolveUpdatePriority() {
      if (currentUpdatePriority !== NoEventPriority) return currentUpdatePriority

      switch (typeof window !== 'undefined' && window.event?.type) {
        case 'click':
        case 'contextmenu':
        case 'dblclick':
        case 'pointercancel':
        case 'pointerdown':
        case 'pointerup':
          return DiscreteEventPriority
        case 'pointermove':
        case 'pointerout':
        case 'pointerover':
        case 'pointerenter':
        case 'pointerleave':
        case 'wheel':
          return ContinuousEventPriority
        default:
          return DefaultEventPriority
      }
    },
    resetFormInstance() {},
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

  function createPortal(_element: React.ReactNode, _container: HostContainer): React.JSX.Element {
    // return <>{reconciler.createPortal(element, container, null, null)}</>
    return <></>
  }

  const resolved = new WeakMap<Promise<any>, boolean>()

  function suspend<T>(value: Promise<T>): T {
    if (resolved.get(value)) return value as T

    if (!resolved.has(value)) {
      resolved.set(value, false)
      value.then(() => resolved.set(value, true))
    }

    throw value
  }

  describe(`${label}-reconciler`, () => {
    it('should go through lifecycle', async () => {
      const lifecycle: string[] = []

      function Test() {
        React.useState(() => lifecycle.push('useState'))
        const ref = React.useRef<any>(null)
        ref.current ??= lifecycle.push('render')
        React.useImperativeHandle(ref, () => void lifecycle.push('ref'))
        React.useLayoutEffect(() => void lifecycle.push('useLayoutEffect'), [])
        React.useEffect(() => void lifecycle.push('useEffect'), [])
        return null
      }
      let container!: HostContainer
      await act(async () => void (container = render(<Test />)))

      expect(lifecycle).toStrictEqual([
        'useState',
        'render',
        // 'useInsertionEffect', // Preact is supposed to call insertion effects during diffing
        'ref',
        'useLayoutEffect',
        'useEffect',
      ])
      expect(container.head).toBe(null)
    })

    it('should render JSX', async () => {
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
      // const promise = Promise.resolve()
      // const Test = () => (suspend(promise), (<element bar />))
      // await act(async () => void (container = render(<Test />)))
      // expect(container.head).toStrictEqual({ type: 'element', props: { bar: true }, children: [] })

      // Portals
      const portalContainer: HostContainer = { head: null }
      await act(async () => void (container = render(createPortal(<element />, portalContainer))))
      expect(container.head).toBe(null)
      expect(portalContainer.head).toBe(null)
      // expect(portalContainer.head).toStrictEqual({ type: 'element', props: {}, children: [] })
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
      const promise = Promise.resolve()
      const Test = () => (suspend(promise), (<>three</>))
      await act(async () => void (container = render(<Test />)))
      expect(container.head).toStrictEqual({ type: 'text', props: { value: 'three' }, children: [] })

      // Portals
      const portalContainer: HostContainer = { head: null }
      await act(async () => void (container = render(createPortal('four', portalContainer))))
      expect(container.head).toBe(null)
      expect(portalContainer.head).toStrictEqual({ type: 'text', props: { value: 'four' }, children: [] })
    })
  })
}
